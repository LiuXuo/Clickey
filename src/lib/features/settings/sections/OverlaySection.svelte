<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";
  import ColorField from "$lib/features/settings/ui/ColorField.svelte";
  import {
    controlInputSpaceWrapClass,
    switchTrackClass,
  } from "$lib/features/settings/ui/control-classes";
  import FieldLabel from "$lib/features/settings/ui/FieldLabel.svelte";

  let {
    config,
    isLoading,
    fieldClass,
    onConfigMutated,
    onFallbackFontSizeInput,
  } = $props<{
    config: AppConfig;
    isLoading: boolean;
    fieldClass: string;
    onConfigMutated: () => void;
    onFallbackFontSizeInput: (event: Event) => void;
  }>();

  function toPositiveInt(value: string, fallback: number): number {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function clampInt(value: string, min: number, max: number, fallback: number) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(Math.max(parsed, min), max);
  }

  function updateColor(
    field: "maskColor" | "lineColor" | "textColor",
    next: string,
  ) {
    config.overlay[field] = next;
    onConfigMutated();
  }
</script>

<SettingsCard id="overlay">
  <SectionHeader title={$t("overlay.title")} icon="overlay" />

  <div class="mt-6 flex flex-wrap items-center gap-x-10 gap-y-3">
    <label
      for="overlay-show-grid"
      class={`settings-text-secondary inline-flex items-center gap-2.5 text-sm font-medium ${
        isLoading ? "opacity-60" : ""
      }`}
    >
      <span class="inline-flex items-center gap-2">
        <AppIcon
          name="showGrid"
          size={15}
          strokeWidth={2.1}
          className="settings-icon-muted"
        />
        <span>{$t("overlay.showGrid")}</span>
      </span>
      <span class="relative inline-flex items-center">
        <input
          id="overlay-show-grid"
          type="checkbox"
          class="peer sr-only"
          bind:checked={config.overlay.showGrid}
          onchange={onConfigMutated}
          disabled={isLoading}
        />
        <span class={switchTrackClass}></span>
      </span>
    </label>

    <label
      for="overlay-show-diagonals"
      class={`settings-text-secondary inline-flex items-center gap-2.5 text-sm font-medium ${
        isLoading ? "opacity-60" : ""
      }`}
    >
      <span class="inline-flex items-center gap-2">
        <AppIcon
          name="showDiagonals"
          size={15}
          strokeWidth={2.1}
          className="settings-icon-muted"
        />
        <span>{$t("overlay.showDiagonals")}</span>
      </span>
      <span class="relative inline-flex items-center">
        <input
          id="overlay-show-diagonals"
          type="checkbox"
          class="peer sr-only"
          bind:checked={config.overlay.showDiagonals}
          onchange={onConfigMutated}
          disabled={isLoading}
        />
        <span class={switchTrackClass}></span>
      </span>
    </label>
  </div>

  <div class={`mt-6 gap-6 ${controlInputSpaceWrapClass}`}>
    <ColorField
      id="overlay-mask-color"
      icon="colorMask"
      label={$t("overlay.maskColor")}
      value={config.overlay.maskColor}
      disabled={isLoading}
      onChange={(next) => updateColor("maskColor", next)}
    />

    <div>
      <FieldLabel
        text={$t("overlay.alpha")}
        icon="alpha"
        forId="overlay-alpha"
      />
      <input
        id="overlay-alpha"
        type="number"
        min="0"
        max="255"
        class={fieldClass}
        value={config.overlay.alpha}
        oninput={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          config.overlay.alpha = clampInt(
            target.value,
            0,
            255,
            config.overlay.alpha,
          );
          onConfigMutated();
        }}
        disabled={isLoading}
      />
    </div>

    <ColorField
      id="overlay-line-color"
      icon="colorLine"
      label={$t("overlay.lineColor")}
      value={config.overlay.lineColor}
      disabled={isLoading}
      onChange={(next) => updateColor("lineColor", next)}
    />

    <div>
      <FieldLabel
        text={$t("overlay.lineWidth")}
        icon="lineWidth"
        forId="overlay-line"
      />
      <input
        id="overlay-line"
        type="number"
        min="1"
        class={fieldClass}
        value={config.overlay.lineWidthPx}
        oninput={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          config.overlay.lineWidthPx = toPositiveInt(
            target.value,
            config.overlay.lineWidthPx,
          );
          onConfigMutated();
        }}
        disabled={isLoading}
      />
    </div>

    <ColorField
      id="overlay-text-color"
      icon="colorText"
      label={$t("overlay.textColor")}
      value={config.overlay.textColor}
      disabled={isLoading}
      onChange={(next) => updateColor("textColor", next)}
    />

    <div>
      <div class="flex items-center gap-1.5">
        <FieldLabel
          text={$t("overlay.fontSize")}
          icon="font"
          forId="overlay-font"
        />
        <span
          class="settings-text-muted inline-flex h-4 w-4 items-center justify-center rounded-full transition hover:opacity-100"
          title={$t("overlay.fontSizeFallback")}
        >
          <AppIcon name="help" size={14} strokeWidth={2.1} />
        </span>
      </div>
      <input
        id="overlay-font"
        type="number"
        min="1"
        class={fieldClass}
        value={config.overlay.font.sizePx}
        oninput={onFallbackFontSizeInput}
        disabled={isLoading}
      />
    </div>

    <div>
      <FieldLabel
        text={$t("overlay.fontFamily")}
        icon="fontFamily"
        forId="overlay-font-family"
      />
      <input
        id="overlay-font-family"
        class={fieldClass}
        bind:value={config.overlay.font.family}
        oninput={onConfigMutated}
        disabled={isLoading}
      />
    </div>
  </div>
</SettingsCard>
