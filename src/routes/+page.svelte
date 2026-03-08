<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";
  import { initLocale, locale, setLocale, t, type Locale } from "$lib/i18n";
  import defaultConfig from "$lib/shared/default-config.json";
  import type { AppConfig } from "$lib/core";
  import SettingsShell, {
    type SettingsSectionItem,
  } from "$lib/features/settings/SettingsShell.svelte";
  import GeneralSection from "$lib/features/settings/sections/GeneralSection.svelte";
  import MouseSection from "$lib/features/settings/sections/MouseSection.svelte";
  import LayersSection from "$lib/features/settings/sections/LayersSection.svelte";
  import HotkeysSection from "$lib/features/settings/sections/HotkeysSection.svelte";
  import OverlaySection from "$lib/features/settings/sections/OverlaySection.svelte";
  import ToastStack, {
    type ToastItem,
    type ToastTone,
  } from "$lib/features/settings/ui/ToastStack.svelte";
  import { canonicalizeHotkey } from "$lib/features/settings/hotkey-utils";

  const initialConfig = ensureLayerFontSizesInConfig(
    JSON.parse(JSON.stringify(defaultConfig)) as AppConfig,
  );

  const fieldClass =
    "mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100";
  const textAreaClass =
    "mt-2 w-full min-h-[100px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs leading-relaxed text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100";
  const compactSelectClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100 appearance-none pr-10";

  const keyPool = [
    "q",
    "w",
    "e",
    "r",
    "t",
    "a",
    "s",
    "d",
    "f",
    "g",
    "z",
    "x",
    "c",
    "v",
    "b",
    "y",
    "u",
    "i",
    "o",
    "p",
    "h",
    "j",
    "k",
    "l",
    ";",
    "n",
    "m",
    ",",
    ".",
    "/",
  ];

  const AUTO_APPLY_DELAY_MS = 320;

  type SectionId = "general" | "mouse" | "layers" | "hotkeys" | "overlay";

  let config = $state<AppConfig>(initialConfig);
  let status = $state("");
  let error = $state("");
  let isLoading = $state(true);
  let isApplying = $state(false);
  let isResetting = $state(false);
  let isImporting = $state(false);
  let isExporting = $state(false);
  let activeSection = $state<SectionId>("general");
  let toasts = $state<ToastItem[]>([]);
  let fileInput: HTMLInputElement | null = null;
  let toastSeed = 0;

  let autoApplyTimer: ReturnType<typeof setTimeout> | null = null;
  let reapplyAfterCurrent = false;

  type ComboLayerConfig = Extract<
    AppConfig["layers"][number],
    { mode: "combo" }
  >;
  type ComboStageConfig = ComboLayerConfig["stage0"];

  const sections = $derived<SettingsSectionItem[]>([
    {
      id: "general",
      label: $t("general.section"),
      icon: "general",
    },
    {
      id: "hotkeys",
      label: $t("hotkeys.section"),
      icon: "hotkeys",
    },
    {
      id: "layers",
      label: $t("layers.section"),
      icon: "layers",
    },
    {
      id: "overlay",
      label: $t("overlay.section"),
      icon: "overlay",
    },
    {
      id: "mouse",
      label: $t("mouse.section"),
      icon: "mouse",
    },
  ]);

  function clearFeedback() {
    status = "";
    error = "";
  }

  function clearAutoApplyTimer() {
    if (!autoApplyTimer) {
      return;
    }
    clearTimeout(autoApplyTimer);
    autoApplyTimer = null;
  }

  function pushToast(tone: ToastTone, message: string) {
    const id = ++toastSeed;
    toasts = [...toasts, { id, tone, message }];
    setTimeout(() => {
      dismissToast(id);
    }, 2600);
  }

  function dismissToast(id: number) {
    toasts = toasts.filter((toast) => toast.id !== id);
  }

  function normalizePositiveInt(value: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    const rounded = Math.round(value);
    return rounded > 0 ? rounded : fallback;
  }

  function normalizeComboAxes(
    stage0: ComboStageConfig,
    stage1: ComboStageConfig,
  ) {
    stage0.rows = 1;
    stage0.cols = normalizePositiveInt(stage0.cols, 1);
    stage1.rows = normalizePositiveInt(stage1.rows, 1);
    stage1.cols = 1;
  }

  function normalizeComboLayersInConfig(candidate: AppConfig): AppConfig {
    candidate.layers.forEach((layer) => {
      if (layer.mode !== "combo") {
        return;
      }
      normalizeComboAxes(layer.stage0, layer.stage1);
    });
    return candidate;
  }

  function ensureLayerFontSizesInConfig(candidate: AppConfig): AppConfig {
    normalizeComboLayersInConfig(candidate);
    const fallbackRaw = Number.isFinite(candidate.overlay.font.sizePx)
      ? candidate.overlay.font.sizePx
      : 12;
    const fallback = Math.max(1, Math.round(fallbackRaw));
    const existing = Array.isArray(candidate.overlay.font.layerSizePx)
      ? candidate.overlay.font.layerSizePx
      : [];
    const normalized: number[] = [];
    for (let index = 0; index < candidate.layers.length; index += 1) {
      const value = existing[index];
      if (Number.isFinite(value) && value > 0) {
        normalized.push(Math.round(value));
      } else {
        normalized.push(fallback);
      }
    }
    candidate.overlay.font.layerSizePx = normalized;
    return candidate;
  }

  function toPositiveInt(value: string, fallback: number): number {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function updateNudgeStep(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    config.nudge.stepPx = toPositiveInt(target.value, config.nudge.stepPx);
    onConfigMutated();
  }

  function parseKeys(value: string): string[] {
    return value.split(/\s+/).filter(Boolean);
  }

  function formatKeys(keys: string[]): string {
    return keys.join(" ");
  }

  function fillKeys(existing: string[], count: number): string[] {
    const result = existing
      .filter((key) => key.trim().length > 0)
      .slice(0, count);
    for (let index = result.length; index < count; index += 1) {
      result.push(keyPool[index % keyPool.length]);
    }
    return result;
  }

  function getDefaultSingleLayer() {
    const candidate = initialConfig.layers.find(
      (layer) => layer.mode === "single",
    );
    if (candidate && candidate.mode === "single") {
      return {
        rows: candidate.rows,
        cols: candidate.cols,
        keys: [...candidate.keys],
      };
    }
    return { rows: 3, cols: 5, keys: keyPool.slice(0, 15) };
  }

  function getDefaultComboLayer() {
    const candidate = initialConfig.layers.find(
      (layer) => layer.mode === "combo",
    );
    if (candidate && candidate.mode === "combo") {
      const stage0 = {
        rows: candidate.stage0.rows,
        cols: candidate.stage0.cols,
        keys: [...candidate.stage0.keys],
      };
      const stage1 = {
        rows: candidate.stage1.rows,
        cols: candidate.stage1.cols,
        keys: [...candidate.stage1.keys],
      };
      normalizeComboAxes(stage0, stage1);
      return {
        stage0,
        stage1,
      };
    }
    return {
      stage0: { rows: 1, cols: 15, keys: keyPool.slice(0, 15) },
      stage1: { rows: 15, cols: 1, keys: keyPool.slice(0, 15) },
    };
  }

  function scheduleAutoApply() {
    if (isLoading || isImporting || isResetting || isExporting) {
      return;
    }

    clearAutoApplyTimer();
    autoApplyTimer = setTimeout(() => {
      autoApplyTimer = null;
      void applyConfig();
    }, AUTO_APPLY_DELAY_MS);
  }

  function onConfigMutated() {
    clearFeedback();
    scheduleAutoApply();
  }

  function getHotkeyEntries(candidate: AppConfig) {
    return [
      {
        label: $t("hotkeys.trigger"),
        value: candidate.hotkeys.activation.trigger,
      },
      {
        label: $t("hotkeys.switchAction"),
        value: candidate.hotkeys.controls.switchAction,
      },
      {
        label: $t("hotkeys.cancel"),
        value: candidate.hotkeys.controls.cancel,
      },
      {
        label: $t("hotkeys.undo"),
        value: candidate.hotkeys.controls.undo,
      },
      {
        label: $t("hotkeys.directClick"),
        value: candidate.hotkeys.controls.directClick,
      },
      {
        label: $t("hotkeys.nextMonitor"),
        value: candidate.hotkeys.controls.nextMonitor,
      },
    ];
  }

  function validateConfig(candidate: AppConfig): string[] {
    const issues: string[] = [];

    if (!candidate.layers.length) {
      issues.push($t("errors.layersRequired"));
      return issues;
    }

    candidate.layers.forEach((layer, index) => {
      if (layer.mode === "single") {
        const expected = layer.rows * layer.cols;
        if (!layer.rows || !layer.cols) {
          issues.push(
            $t("errors.layerGridInvalidSimple", { index: index + 1 }),
          );
        }
        if (layer.keys.length !== expected) {
          issues.push(
            $t("errors.layerExpectedKeysSimple", {
              index: index + 1,
              expected,
            }),
          );
        }
      } else {
        normalizeComboAxes(layer.stage0, layer.stage1);
        const expected0 = layer.stage0.rows * layer.stage0.cols;
        const expected1 = layer.stage1.rows * layer.stage1.cols;
        if (!layer.stage0.cols) {
          issues.push(
            $t("errors.stage0GridInvalidSimple", { index: index + 1 }),
          );
        }
        if (!layer.stage1.rows) {
          issues.push(
            $t("errors.stage1GridInvalidSimple", { index: index + 1 }),
          );
        }
        if (layer.stage0.rows !== 1 || layer.stage1.cols !== 1) {
          issues.push(
            $t("errors.comboAxisConstraintSimple", { index: index + 1 }),
          );
        }
        if (layer.stage0.keys.length !== expected0) {
          issues.push(
            $t("errors.stage0ExpectedKeysSimple", {
              index: index + 1,
              expected: expected0,
            }),
          );
        }
        if (layer.stage1.keys.length !== expected1) {
          issues.push(
            $t("errors.stage1ExpectedKeysSimple", {
              index: index + 1,
              expected: expected1,
            }),
          );
        }
      }
    });

    const seenHotkeys: Record<string, string> = {};
    for (const entry of getHotkeyEntries(candidate)) {
      const canonical = canonicalizeHotkey(entry.value);
      if (!canonical) {
        continue;
      }
      const existing = seenHotkeys[canonical];
      if (existing && existing !== entry.label) {
        issues.push(
          $t("errors.hotkeyConflict", {
            first: existing,
            second: entry.label,
          }),
        );
        break;
      }
      seenHotkeys[canonical] = entry.label;
    }

    if (candidate.nudge.stepPx <= 0) {
      issues.push($t("errors.nudgeStep"));
    }
    if (!Number.isFinite(candidate.mouse.moveDurationMs)) {
      issues.push($t("errors.mouseMoveDuration"));
    } else if (candidate.mouse.moveDurationMs <= 0) {
      issues.push($t("errors.mouseMoveDuration"));
    }
    if (!Number.isFinite(candidate.mouse.moveStepMs)) {
      issues.push($t("errors.mouseMoveStep"));
    } else if (candidate.mouse.moveStepMs <= 0) {
      issues.push($t("errors.mouseMoveStep"));
    }
    if (!Number.isFinite(candidate.mouse.pressDurationMs)) {
      issues.push($t("errors.mousePressDuration"));
    } else if (candidate.mouse.pressDurationMs < 0) {
      issues.push($t("errors.mousePressDuration"));
    }
    if (!Number.isFinite(candidate.mouse.landingRadiusPx)) {
      issues.push($t("errors.mouseLandingRadius"));
    } else if (candidate.mouse.landingRadiusPx < 0) {
      issues.push($t("errors.mouseLandingRadius"));
    }
    if (!Number.isFinite(candidate.mouse.durationRandomness)) {
      issues.push($t("errors.mouseDurationRandomness"));
    } else if (
      candidate.mouse.durationRandomness < 0 ||
      candidate.mouse.durationRandomness >= 1
    ) {
      issues.push($t("errors.mouseDurationRandomness"));
    }
    if (!Number.isFinite(candidate.mouse.stepRandomness)) {
      issues.push($t("errors.mouseStepRandomness"));
    } else if (
      candidate.mouse.stepRandomness < 0 ||
      candidate.mouse.stepRandomness >= 1
    ) {
      issues.push($t("errors.mouseStepRandomness"));
    }
    if (!Number.isFinite(candidate.mouse.distanceBoostPx)) {
      issues.push($t("errors.mouseDistanceBoostPx"));
    } else if (candidate.mouse.distanceBoostPx <= 0) {
      issues.push($t("errors.mouseDistanceBoostPx"));
    }
    if (!Number.isFinite(candidate.mouse.durationDistanceBoost)) {
      issues.push($t("errors.mouseDurationDistanceBoost"));
    } else if (
      candidate.mouse.durationDistanceBoost < 0 ||
      candidate.mouse.durationDistanceBoost >= 1
    ) {
      issues.push($t("errors.mouseDurationDistanceBoost"));
    }
    if (!Number.isFinite(candidate.mouse.stepDistanceBoost)) {
      issues.push($t("errors.mouseStepDistanceBoost"));
    } else if (
      candidate.mouse.stepDistanceBoost < 0 ||
      candidate.mouse.stepDistanceBoost >= 1
    ) {
      issues.push($t("errors.mouseStepDistanceBoost"));
    }
    if (!Number.isFinite(candidate.mouse.curveAlongRatio)) {
      issues.push($t("errors.mouseCurveAlongRatio"));
    } else if (
      candidate.mouse.curveAlongRatio < 0 ||
      candidate.mouse.curveAlongRatio > 1
    ) {
      issues.push($t("errors.mouseCurveAlongRatio"));
    }
    if (!Number.isFinite(candidate.mouse.curveSpreadRatio)) {
      issues.push($t("errors.mouseCurveSpreadRatio"));
    } else if (
      candidate.mouse.curveSpreadRatio < 0 ||
      candidate.mouse.curveSpreadRatio > 1
    ) {
      issues.push($t("errors.mouseCurveSpreadRatio"));
    }
    if (!Number.isFinite(candidate.mouse.jitterRatio)) {
      issues.push($t("errors.mouseJitterRatio"));
    } else if (
      candidate.mouse.jitterRatio < 0 ||
      candidate.mouse.jitterRatio > 0.2
    ) {
      issues.push($t("errors.mouseJitterRatio"));
    }
    if (!Number.isFinite(candidate.mouse.adaptiveStrideBasePx)) {
      issues.push($t("errors.mouseAdaptiveStrideBase"));
    } else if (candidate.mouse.adaptiveStrideBasePx <= 0) {
      issues.push($t("errors.mouseAdaptiveStrideBase"));
    }
    if (!Number.isFinite(candidate.mouse.adaptiveStrideDistanceRatio)) {
      issues.push($t("errors.mouseAdaptiveStrideDistanceRatio"));
    } else if (candidate.mouse.adaptiveStrideDistanceRatio < 0) {
      issues.push($t("errors.mouseAdaptiveStrideDistanceRatio"));
    }
    if (!Number.isFinite(candidate.mouse.adaptiveStrideMaxPx)) {
      issues.push($t("errors.mouseAdaptiveStrideMax"));
    } else if (
      candidate.mouse.adaptiveStrideMaxPx < candidate.mouse.adaptiveStrideBasePx
    ) {
      issues.push($t("errors.mouseAdaptiveStrideMax"));
    }
    if (!Number.isFinite(candidate.mouse.extraStepsMax)) {
      issues.push($t("errors.mouseExtraStepsMax"));
    } else if (candidate.mouse.extraStepsMax < 0) {
      issues.push($t("errors.mouseExtraStepsMax"));
    }
    if (!Number.isFinite(candidate.mouse.maxSteps)) {
      issues.push($t("errors.mouseMaxSteps"));
    } else if (candidate.mouse.maxSteps < 2) {
      issues.push($t("errors.mouseMaxSteps"));
    }
    if (!Number.isFinite(candidate.mouse.maxStepSleepMs)) {
      issues.push($t("errors.mouseMaxStepSleepMs"));
    } else if (candidate.mouse.maxStepSleepMs <= 0) {
      issues.push($t("errors.mouseMaxStepSleepMs"));
    }
    if (candidate.overlay.lineWidthPx <= 0) {
      issues.push($t("errors.overlayLineWidth"));
    }
    if (candidate.overlay.font.sizePx <= 0) {
      issues.push($t("errors.overlayFontSize"));
    }
    for (const sizePx of candidate.overlay.font.layerSizePx) {
      if (!Number.isFinite(sizePx) || sizePx <= 0) {
        issues.push($t("errors.overlayFontSize"));
        break;
      }
    }

    return issues;
  }

  async function applyConfig() {
    if (isLoading) {
      return;
    }

    if (isApplying) {
      reapplyAfterCurrent = true;
      return;
    }

    config = ensureLayerFontSizesInConfig(config);
    const issues = validateConfig(config);
    if (issues.length) {
      status = "";
      error = issues[0];
      return;
    }

    isApplying = true;
    error = "";

    try {
      await invoke("apply_config", { config });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      pushToast("error", message);
    } finally {
      isApplying = false;
      if (reapplyAfterCurrent) {
        reapplyAfterCurrent = false;
        scheduleAutoApply();
      }
    }
  }

  async function resetConfig() {
    clearAutoApplyTimer();
    clearFeedback();
    isResetting = true;
    try {
      const reset = await invoke<AppConfig>("reset_config");
      config = ensureLayerFontSizesInConfig(reset);
      if (reset.app.locale === "zh-CN" || reset.app.locale === "en-US") {
        setLocale(reset.app.locale);
      }
      status = $t("status.reset");
      pushToast("success", $t("status.reset"));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      pushToast("error", message);
    } finally {
      isResetting = false;
    }
  }

  async function exportOverrideJson() {
    clearFeedback();
    isExporting = true;
    try {
      const json = await invoke<string>("export_override_json");
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "clickey.settings.override.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      status = $t("status.exported");
      pushToast("success", $t("status.exported"));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      pushToast("error", message);
    } finally {
      isExporting = false;
    }
  }

  function openImportPicker() {
    fileInput?.click();
  }

  async function onImportFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }

    clearAutoApplyTimer();
    clearFeedback();
    isImporting = true;

    try {
      const json = await file.text();
      const imported = await invoke<AppConfig>("import_override_json", {
        json,
      });
      config = ensureLayerFontSizesInConfig(imported);
      if (imported.app.locale === "zh-CN" || imported.app.locale === "en-US") {
        setLocale(imported.app.locale);
      }
      status = $t("status.imported");
      pushToast("success", $t("status.imported"));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      pushToast("error", message);
    } finally {
      isImporting = false;
    }
  }

  function onLocaleChange(next: Locale) {
    setLocale(next);
    config.app.locale = next;
    clearFeedback();
    void invoke("set_locale", { locale: next }).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      pushToast("error", message);
    });
    scheduleAutoApply();
  }

  function switchLayerMode(index: number, mode: "single" | "combo") {
    const layer = config.layers[index];
    if (!layer || layer.mode === mode) {
      return;
    }

    if (mode === "single") {
      const defaults = getDefaultSingleLayer();
      const pooled =
        layer.mode === "combo"
          ? [...layer.stage0.keys, ...layer.stage1.keys]
          : layer.keys;
      const nextLayers = [...config.layers];
      nextLayers[index] = {
        mode: "single",
        rows: defaults.rows,
        cols: defaults.cols,
        keys: fillKeys(pooled, defaults.rows * defaults.cols),
      };
      config.layers = nextLayers;
      onConfigMutated();
      return;
    }

    const defaults = getDefaultComboLayer();
    const pooled =
      layer.mode === "single"
        ? layer.keys
        : [...layer.stage0.keys, ...layer.stage1.keys];
    const nextLayers = [...config.layers];
    nextLayers[index] = {
      mode: "combo",
      stage0: {
        ...defaults.stage0,
        keys: fillKeys(pooled, defaults.stage0.rows * defaults.stage0.cols),
      },
      stage1: {
        ...defaults.stage1,
        keys: fillKeys(pooled, defaults.stage1.rows * defaults.stage1.cols),
      },
    };
    config.layers = nextLayers;
    onConfigMutated();
  }

  function addSingleLayer() {
    const fallbackFontSize = Math.max(
      1,
      Math.round(config.overlay.font.sizePx),
    );
    const base = getDefaultSingleLayer();
    config.layers = [
      ...config.layers,
      {
        mode: "single",
        rows: base.rows,
        cols: base.cols,
        keys: fillKeys(base.keys, base.rows * base.cols),
      },
    ];
    config.overlay.font.layerSizePx = [
      ...config.overlay.font.layerSizePx,
      fallbackFontSize,
    ];
    onConfigMutated();
  }

  function addComboLayer() {
    const fallbackFontSize = Math.max(
      1,
      Math.round(config.overlay.font.sizePx),
    );
    const base = getDefaultComboLayer();
    config.layers = [
      ...config.layers,
      {
        mode: "combo",
        stage0: {
          ...base.stage0,
          keys: fillKeys(base.stage0.keys, base.stage0.rows * base.stage0.cols),
        },
        stage1: {
          ...base.stage1,
          keys: fillKeys(base.stage1.keys, base.stage1.rows * base.stage1.cols),
        },
      },
    ];
    config.overlay.font.layerSizePx = [
      ...config.overlay.font.layerSizePx,
      fallbackFontSize,
    ];
    onConfigMutated();
  }

  function moveLayer(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= config.layers.length) {
      return;
    }
    const nextLayers = [...config.layers];
    const [moved] = nextLayers.splice(index, 1);
    nextLayers.splice(nextIndex, 0, moved);
    config.layers = nextLayers;

    const nextLayerFontSizes = [...config.overlay.font.layerSizePx];
    const [movedFontSize] = nextLayerFontSizes.splice(index, 1);
    const fallbackFontSize = Math.max(
      1,
      Math.round(config.overlay.font.sizePx),
    );
    nextLayerFontSizes.splice(nextIndex, 0, movedFontSize ?? fallbackFontSize);
    config.overlay.font.layerSizePx = nextLayerFontSizes;
    onConfigMutated();
  }

  function removeLayer(index: number) {
    if (config.layers.length <= 1) {
      error = $t("errors.layersRequired");
      return;
    }
    if (!confirm($t("errors.removeLayerConfirm", { index: index + 1 }))) {
      return;
    }
    config.layers = config.layers.filter(
      (_, layerIndex) => layerIndex !== index,
    );
    config.overlay.font.layerSizePx = config.overlay.font.layerSizePx.filter(
      (_, layerIndex) => layerIndex !== index,
    );
    onConfigMutated();
  }

  function updateSingleLayerGrid(
    index: number,
    field: "rows" | "cols",
    event: Event,
  ) {
    const layer = config.layers[index];
    if (!layer || layer.mode !== "single") {
      return;
    }
    const target = event.currentTarget as HTMLInputElement;
    layer[field] = toPositiveInt(target.value, layer[field]);
    onConfigMutated();
  }

  function updateSingleLayerKeys(index: number, event: Event) {
    const layer = config.layers[index];
    if (!layer || layer.mode !== "single") {
      return;
    }
    const target = event.currentTarget as HTMLTextAreaElement;
    layer.keys = parseKeys(target.value);
    onConfigMutated();
  }

  function updateComboStageGrid(
    index: number,
    stage: 0 | 1,
    field: "rows" | "cols",
    event: Event,
  ) {
    const layer = config.layers[index];
    if (!layer || layer.mode !== "combo") {
      return;
    }
    const target = event.currentTarget as HTMLInputElement;
    if (stage === 0) {
      layer.stage0.rows = 1;
      if (field === "cols") {
        layer.stage0.cols = toPositiveInt(target.value, layer.stage0.cols);
      }
    } else {
      layer.stage1.cols = 1;
      if (field === "rows") {
        layer.stage1.rows = toPositiveInt(target.value, layer.stage1.rows);
      }
    }
    onConfigMutated();
  }

  function updateComboStageKeys(index: number, stage: 0 | 1, event: Event) {
    const layer = config.layers[index];
    if (!layer || layer.mode !== "combo") {
      return;
    }
    const target = event.currentTarget as HTMLTextAreaElement;
    const stageConfig = stage === 0 ? layer.stage0 : layer.stage1;
    stageConfig.keys = parseKeys(target.value);
    onConfigMutated();
  }

  function updateLayerFontSize(index: number, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const next = [...config.overlay.font.layerSizePx];
    const fallback = next[index] ?? config.overlay.font.sizePx;
    next[index] = toPositiveInt(target.value, fallback);
    config.overlay.font.layerSizePx = next;
    onConfigMutated();
  }

  function onFallbackFontSizeInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    config.overlay.font.sizePx = toPositiveInt(
      target.value,
      config.overlay.font.sizePx,
    );
    config = ensureLayerFontSizesInConfig(config);
    onConfigMutated();
  }

  function isSectionId(value: string): value is SectionId {
    return (
      value === "general" ||
      value === "mouse" ||
      value === "layers" ||
      value === "hotkeys" ||
      value === "overlay"
    );
  }

  function selectSection(id: string) {
    if (!isSectionId(id)) {
      return;
    }
    activeSection = id;
    if (typeof window !== "undefined") {
      const nextHash = `#${id}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    }
  }

  function syncSectionFromHash() {
    if (typeof window === "undefined") {
      return;
    }
    const hash = window.location.hash.replace(/^#/, "");
    if (isSectionId(hash)) {
      activeSection = hash;
    }
  }

  onMount(() => {
    initLocale();
    syncSectionFromHash();

    const onHashChange = () => {
      syncSectionFromHash();
    };

    window.addEventListener("hashchange", onHashChange);

    void (async () => {
      try {
        const loaded = await invoke<AppConfig>("get_config");
        config = ensureLayerFontSizesInConfig(loaded);
        if (loaded.app.locale === "zh-CN" || loaded.app.locale === "en-US") {
          setLocale(loaded.app.locale);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        error = message;
        pushToast("error", message);
      } finally {
        isLoading = false;
      }
    })();

    return () => {
      clearAutoApplyTimer();
      window.removeEventListener("hashchange", onHashChange);
    };
  });
</script>

<main class="h-screen overflow-hidden px-4 py-4">
  <input
    bind:this={fileInput}
    type="file"
    accept="application/json,.json"
    class="hidden"
    onchange={onImportFileChange}
  />

  <div
    class="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 overflow-hidden"
  >
    {#if status || error}
      <div class="flex flex-wrap items-center gap-3 text-sm">
        {#if status}
          <span class="font-semibold text-zinc-800">{status}</span>
        {/if}
        {#if error}
          <span class="font-semibold text-zinc-500">{error}</span>
        {/if}
      </div>
    {/if}

    <div class="min-h-0 flex-1">
      <SettingsShell {sections} {activeSection} onSelectSection={selectSection}>
        <div class="mt-6" class:hidden={activeSection !== "general"}>
          <GeneralSection
            localeValue={$locale}
            {isLoading}
            {compactSelectClass}
            {isImporting}
            {isExporting}
            {isResetting}
            {isApplying}
            onImport={openImportPicker}
            onExport={exportOverrideJson}
            onReset={resetConfig}
            {onLocaleChange}
          />
        </div>

        <div class:hidden={activeSection !== "mouse"}>
          <MouseSection {config} {isLoading} {fieldClass} {onConfigMutated} />
        </div>

        <div class:hidden={activeSection !== "layers"}>
          <LayersSection
            {config}
            {isLoading}
            {fieldClass}
            selectClass={compactSelectClass}
            {textAreaClass}
            onUpdateNudgeStep={updateNudgeStep}
            onAddSingleLayer={addSingleLayer}
            onAddComboLayer={addComboLayer}
            onSwitchLayerMode={switchLayerMode}
            onMoveLayer={moveLayer}
            onRemoveLayer={removeLayer}
            onUpdateSingleLayerGrid={updateSingleLayerGrid}
            onUpdateSingleLayerKeys={updateSingleLayerKeys}
            onUpdateComboStageGrid={updateComboStageGrid}
            onUpdateComboStageKeys={updateComboStageKeys}
            onUpdateLayerFontSize={updateLayerFontSize}
            {formatKeys}
          />
        </div>

        <div class:hidden={activeSection !== "hotkeys"}>
          <HotkeysSection {config} {isLoading} {onConfigMutated} />
        </div>

        <div class:hidden={activeSection !== "overlay"}>
          <OverlaySection
            {config}
            {isLoading}
            {fieldClass}
            {onConfigMutated}
            {onFallbackFontSizeInput}
          />
        </div>
      </SettingsShell>
    </div>
  </div>

  <ToastStack {toasts} onDismiss={dismissToast} />
</main>
