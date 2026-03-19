<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { revealItemInDir } from "@tauri-apps/plugin-opener";
  import { onMount } from "svelte";
  import {
    initLocale,
    setLocalePreference,
    t,
    type LocalePreference,
  } from "$lib/i18n";
  import {
    resolveSettingsTheme,
    type ResolvedSettingsTheme,
  } from "$lib/features/settings/theme";
  import { getDefaultConfig } from "$lib/shared/default-config";
  import type {
    AppConfig,
    MouseAction,
    SettingsThemePreference,
  } from "$lib/core";
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
  import {
    controlInputWithMarginClass,
    controlSelectClass,
  } from "$lib/features/settings/ui/control-classes";
  import { canonicalizeHotkey } from "$lib/features/settings/hotkey-utils";
  import { toLocalizedErrorMessage } from "$lib/features/settings/error-message";

  const fieldClass = controlInputWithMarginClass;
  const compactSelectClass = controlSelectClass;

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
  const TOAST_AUTO_DISMISS_MS = 5000;
  const supportedMouseActions: MouseAction[] = [
    "left",
    "right",
    "middle",
    "moveOnly",
    "doubleLeft",
    "ctrlLeft",
    "cmdLeft",
    "shiftLeft",
  ];
  const supportedMouseActionSet = new Set<MouseAction>(supportedMouseActions);
  const initialConfig = ensureLayerFontSizesInConfig(getDefaultConfig());

  function detectSystemPrefersDark(): boolean {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return false;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  type SectionId = "general" | "mouse" | "layers" | "hotkeys" | "overlay";

  let config = $state<AppConfig>(initialConfig);
  let systemPrefersDark = $state(detectSystemPrefersDark());
  let isLoading = $state(true);
  let isApplying = $state(false);
  let isResetting = $state(false);
  let isImporting = $state(false);
  let isExporting = $state(false);
  let isOpeningConfigDir = $state(false);
  let canReset = $state(false);
  let activeSection = $state<SectionId>("general");
  let toasts = $state<ToastItem[]>([]);
  let fileInput: HTMLInputElement | null = null;
  let toastSeed = 0;

  let autoApplyTimer: ReturnType<typeof setTimeout> | null = null;
  let reapplyAfterCurrent = false;
  let lastValidationIssue = "";

  type ComboLayerConfig = Extract<
    AppConfig["layers"][number],
    { mode: "combo" }
  >;
  type ComboStageConfig = ComboLayerConfig["stage0"];
  type BackendErrorPayload = {
    code: string;
  };

  let resolvedSettingsTheme = $derived<ResolvedSettingsTheme>(
    resolveSettingsTheme(config.app.settingsWindow.theme, systemPrefersDark),
  );

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
    }, TOAST_AUTO_DISMISS_MS);
  }

  function dismissToast(id: number) {
    toasts = toasts.filter((toast) => toast.id !== id);
  }

  function resolveErrorMessage(error: unknown): string {
    return toLocalizedErrorMessage(error, $t);
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

  function normalizeMouseActionsInConfig(candidate: AppConfig): AppConfig {
    const rawOrder = Array.isArray(candidate.mouse.actionCycle)
      ? candidate.mouse.actionCycle
      : [];
    const normalizedOrder: MouseAction[] = [];
    for (const action of rawOrder) {
      if (
        !supportedMouseActionSet.has(action) ||
        normalizedOrder.includes(action)
      ) {
        continue;
      }
      normalizedOrder.push(action);
    }
    for (const action of supportedMouseActions) {
      if (!normalizedOrder.includes(action)) {
        normalizedOrder.push(action);
      }
    }
    candidate.mouse.actionCycle = normalizedOrder;

    const rawDisabled = Array.isArray(candidate.mouse.disabledActions)
      ? candidate.mouse.disabledActions
      : [];
    const normalizedDisabled: MouseAction[] = [];
    for (const action of rawDisabled) {
      if (
        !supportedMouseActionSet.has(action) ||
        normalizedDisabled.includes(action)
      ) {
        continue;
      }
      normalizedDisabled.push(action);
    }
    for (const action of supportedMouseActions) {
      if (!rawOrder.includes(action) && !normalizedDisabled.includes(action)) {
        normalizedDisabled.push(action);
      }
    }
    if (normalizedDisabled.length >= normalizedOrder.length) {
      normalizedDisabled.splice(normalizedOrder.length - 1);
    }
    candidate.mouse.disabledActions = normalizedDisabled;
    return candidate;
  }

  function ensureLayerFontSizesInConfig(candidate: AppConfig): AppConfig {
    normalizeComboLayersInConfig(candidate);
    normalizeMouseActionsInConfig(candidate);
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

  function normalizeLayerKey(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return "";
    }
    const [first] = Array.from(trimmed);
    return (first ?? "").toLowerCase();
  }

  function normalizeLayerKeys(keys: string[]): string[] {
    return keys.map((key) => normalizeLayerKey(key));
  }

  function collectDuplicateLayerKeys(keys: string[]): string[] {
    const counts: Record<string, number> = {};
    const duplicates: string[] = [];

    for (const key of normalizeLayerKeys(keys)) {
      if (!key) {
        continue;
      }
      const nextCount = (counts[key] ?? 0) + 1;
      counts[key] = nextCount;
      if (nextCount === 2) {
        duplicates.push(key);
      }
    }

    return duplicates;
  }

  function hasEmptyLayerKey(keys: string[]): boolean {
    return normalizeLayerKeys(keys).some((key) => key.length === 0);
  }

  function fillKeys(existing: string[], count: number): string[] {
    const result = normalizeLayerKeys(existing).filter(Boolean).slice(0, count);
    for (let index = result.length; index < count; index += 1) {
      result.push(keyPool[index % keyPool.length]);
    }
    return result;
  }

  function resizeKeys(existing: string[], count: number): string[] {
    const resized = normalizeLayerKeys(existing).slice(0, count);
    while (resized.length < count) {
      resized.push("");
    }
    return resized;
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
    scheduleAutoApply();
  }

  function isEmptyOverridePayload(value: unknown): boolean {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    return Object.keys(value).length === 0;
  }

  async function refreshResetAvailability() {
    try {
      const json = await invoke<string>("export_override_json");
      const payload: unknown = JSON.parse(json);
      canReset = !isEmptyOverridePayload(payload);
    } catch {
      // Fail open to avoid locking the reset action when inspection fails.
      canReset = true;
    }
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
      {
        label: $t("hotkeys.nudgeLeft"),
        value: candidate.hotkeys.controls.nudgeLeft,
      },
      {
        label: $t("hotkeys.nudgeRight"),
        value: candidate.hotkeys.controls.nudgeRight,
      },
      {
        label: $t("hotkeys.nudgeUp"),
        value: candidate.hotkeys.controls.nudgeUp,
      },
      {
        label: $t("hotkeys.nudgeDown"),
        value: candidate.hotkeys.controls.nudgeDown,
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
        if (hasEmptyLayerKey(layer.keys)) {
          issues.push(
            $t("errors.layerEmptyKeysSimple", {
              index: index + 1,
            }),
          );
        }
        const duplicateKeys = collectDuplicateLayerKeys(layer.keys);
        if (duplicateKeys.length > 0) {
          issues.push(
            $t("errors.layerDuplicateKeysSimple", {
              index: index + 1,
              keys: duplicateKeys.join(" "),
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
        if (hasEmptyLayerKey(layer.stage0.keys)) {
          issues.push(
            $t("errors.stage0EmptyKeysSimple", {
              index: index + 1,
            }),
          );
        }
        if (hasEmptyLayerKey(layer.stage1.keys)) {
          issues.push(
            $t("errors.stage1EmptyKeysSimple", {
              index: index + 1,
            }),
          );
        }
        const stage0DuplicateKeys = collectDuplicateLayerKeys(
          layer.stage0.keys,
        );
        if (stage0DuplicateKeys.length > 0) {
          issues.push(
            $t("errors.stage0DuplicateKeysSimple", {
              index: index + 1,
              keys: stage0DuplicateKeys.join(" "),
            }),
          );
        }
        const stage1DuplicateKeys = collectDuplicateLayerKeys(
          layer.stage1.keys,
        );
        if (stage1DuplicateKeys.length > 0) {
          issues.push(
            $t("errors.stage1DuplicateKeysSimple", {
              index: index + 1,
              keys: stage1DuplicateKeys.join(" "),
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
    const actionCycle = Array.isArray(candidate.mouse.actionCycle)
      ? candidate.mouse.actionCycle
      : [];
    if (actionCycle.length === 0) {
      issues.push($t("errors.mouseActionCycleEmpty"));
    } else {
      const seenActions: Partial<Record<MouseAction, true>> = {};
      for (const action of actionCycle) {
        if (!supportedMouseActionSet.has(action)) {
          issues.push($t("errors.mouseActionUnsupported"));
          break;
        }
        if (seenActions[action]) {
          issues.push($t("errors.mouseActionCycleDuplicate"));
          break;
        }
        seenActions[action] = true;
      }
    }
    const disabledActions = Array.isArray(candidate.mouse.disabledActions)
      ? candidate.mouse.disabledActions
      : [];
    const seenDisabledActions: Partial<Record<MouseAction, true>> = {};
    for (const action of disabledActions) {
      if (!supportedMouseActionSet.has(action)) {
        issues.push($t("errors.mouseActionUnsupported"));
        break;
      }
      if (seenDisabledActions[action]) {
        issues.push($t("errors.mouseActionCycleDuplicate"));
        break;
      }
      seenDisabledActions[action] = true;
    }
    if (
      Object.keys(seenDisabledActions).length >= actionCycle.length &&
      actionCycle.length > 0
    ) {
      issues.push($t("errors.mouseActionCycleEmpty"));
    }
    if (candidate.mouse.smoothMove) {
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
      const firstIssue = issues[0];
      if (firstIssue !== lastValidationIssue) {
        lastValidationIssue = firstIssue;
        pushToast("error", firstIssue);
      }
      return;
    }
    lastValidationIssue = "";

    isApplying = true;

    try {
      await invoke("apply_config", { config });
      await refreshResetAvailability();
    } catch (err) {
      const message = resolveErrorMessage(err);
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
    if (!canReset) {
      return;
    }

    clearAutoApplyTimer();
    isResetting = true;
    try {
      const reset = await invoke<AppConfig>("reset_config");
      config = ensureLayerFontSizesInConfig(reset);
      lastValidationIssue = "";
      await refreshResetAvailability();
      setLocalePreference(reset.app.locale);
      pushToast("success", $t("status.reset"));
    } catch (err) {
      const message = resolveErrorMessage(err);
      pushToast("error", message);
    } finally {
      isResetting = false;
    }
  }

  async function exportOverrideJson() {
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
      pushToast("success", $t("status.exported"));
    } catch (err) {
      const message = resolveErrorMessage(err);
      pushToast("error", message);
    } finally {
      isExporting = false;
    }
  }

  async function openConfigDirectory() {
    isOpeningConfigDir = true;
    try {
      const directory = await invoke<string>("get_config_dir");
      await revealItemInDir(directory);
      pushToast("success", $t("status.openedConfigDir"));
    } catch (err) {
      const message = resolveErrorMessage(err);
      pushToast("error", message);
    } finally {
      isOpeningConfigDir = false;
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
    isImporting = true;

    try {
      const json = await file.text();
      const imported = await invoke<AppConfig>("import_override_json", {
        json,
      });
      config = ensureLayerFontSizesInConfig(imported);
      lastValidationIssue = "";
      await refreshResetAvailability();
      setLocalePreference(imported.app.locale);
      pushToast("success", $t("status.imported"));
    } catch (err) {
      const message = resolveErrorMessage(err);
      pushToast("error", message);
    } finally {
      isImporting = false;
    }
  }

  function onLocaleChange(next: LocalePreference) {
    setLocalePreference(next);
    config.app.locale = next;
    void invoke("set_locale", { locale: next })
      .catch((err) => {
        const message = resolveErrorMessage(err);
        pushToast("error", message);
      })
      .then(() => {
        void refreshResetAvailability();
      });
    scheduleAutoApply();
  }

  function onThemeChange(next: SettingsThemePreference) {
    config.app.settingsWindow.theme = next;
    scheduleAutoApply();
  }

  function onLaunchOnLoginChange(next: boolean) {
    config.app.launchOnLogin.enabled = next;
    pushToast(
      "info",
      next
        ? `${$t("status.launchOnLoginUpdated")} ${$t("general.launchOnLoginHint")}`
        : $t("status.launchOnLoginUpdated"),
    );
    scheduleAutoApply();
  }

  function onOpenOnLaunchChange(next: boolean) {
    config.app.settingsWindow.openOnLaunch = next;
    pushToast("info", $t("status.startupOpenOnLaunchUpdated"));
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
      pushToast("error", $t("errors.layersRequired"));
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
    const expected = layer.rows * layer.cols;
    layer.keys = resizeKeys(layer.keys, expected);
    onConfigMutated();
  }

  function updateSingleLayerKeys(index: number, keys: string[]) {
    const layer = config.layers[index];
    if (!layer || layer.mode !== "single") {
      return;
    }
    const expected = layer.rows * layer.cols;
    layer.keys = normalizeLayerKeys(keys).slice(0, expected);
    while (layer.keys.length < expected) {
      layer.keys.push("");
    }
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
      const expected = layer.stage0.rows * layer.stage0.cols;
      layer.stage0.keys = resizeKeys(layer.stage0.keys, expected);
    } else {
      layer.stage1.cols = 1;
      if (field === "rows") {
        layer.stage1.rows = toPositiveInt(target.value, layer.stage1.rows);
      }
      const expected = layer.stage1.rows * layer.stage1.cols;
      layer.stage1.keys = resizeKeys(layer.stage1.keys, expected);
    }
    onConfigMutated();
  }

  function updateComboStageKeys(index: number, stage: 0 | 1, keys: string[]) {
    const layer = config.layers[index];
    if (!layer || layer.mode !== "combo") {
      return;
    }
    const stageConfig = stage === 0 ? layer.stage0 : layer.stage1;
    const expected = stageConfig.rows * stageConfig.cols;
    stageConfig.keys = normalizeLayerKeys(keys).slice(0, expected);
    while (stageConfig.keys.length < expected) {
      stageConfig.keys.push("");
    }
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
    let unlistenBackendError: (() => void) | undefined;
    const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const onHashChange = () => {
      syncSectionFromHash();
    };
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      systemPrefersDark = event.matches;
    };

    systemPrefersDark = systemThemeMedia.matches;
    window.addEventListener("hashchange", onHashChange);
    systemThemeMedia.addEventListener("change", onSystemThemeChange);

    void (async () => {
      unlistenBackendError = await listen<BackendErrorPayload>(
        "backend:error",
        (event) => {
          pushToast("error", resolveErrorMessage(event.payload.code));
        },
      );
    })();

    void (async () => {
      try {
        const loaded = await invoke<AppConfig>("get_config");
        config = ensureLayerFontSizesInConfig(loaded);
        lastValidationIssue = "";
        await refreshResetAvailability();
        setLocalePreference(loaded.app.locale);
      } catch (err) {
        const message = resolveErrorMessage(err);
        pushToast("error", message);
      } finally {
        isLoading = false;
      }
    })();

    return () => {
      clearAutoApplyTimer();
      window.removeEventListener("hashchange", onHashChange);
      systemThemeMedia.removeEventListener("change", onSystemThemeChange);
      unlistenBackendError?.();
    };
  });
</script>

<main
  class="settings-theme settings-scrollbar h-full overflow-y-auto px-4 py-4"
  data-theme={resolvedSettingsTheme}
>
  <input
    bind:this={fileInput}
    type="file"
    accept="application/json,.json"
    class="hidden"
    onchange={onImportFileChange}
  />

  <div class="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4">
    <div class="flex-1">
      <SettingsShell {sections} {activeSection} onSelectSection={selectSection}>
        <div class="mt-6" class:hidden={activeSection !== "general"}>
          <GeneralSection
            localeValue={config.app.locale}
            themeValue={config.app.settingsWindow.theme}
            launchOnLoginValue={config.app.launchOnLogin.enabled}
            openOnLaunchValue={config.app.settingsWindow.openOnLaunch}
            {isLoading}
            {compactSelectClass}
            {isImporting}
            {isExporting}
            {isOpeningConfigDir}
            {isResetting}
            {isApplying}
            {canReset}
            onImport={openImportPicker}
            onExport={exportOverrideJson}
            onOpenConfigDir={openConfigDirectory}
            onReset={resetConfig}
            {onLocaleChange}
            {onThemeChange}
            {onLaunchOnLoginChange}
            {onOpenOnLaunchChange}
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
          />
        </div>

        <div class:hidden={activeSection !== "hotkeys"}>
          <HotkeysSection
            {config}
            {isLoading}
            {fieldClass}
            {onConfigMutated}
            onUpdateNudgeStep={updateNudgeStep}
          />
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
