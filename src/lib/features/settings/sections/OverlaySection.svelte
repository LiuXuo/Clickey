<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import ColorField from "$lib/features/settings/ui/ColorField.svelte";

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
      class={`inline-flex items-center gap-2.5 text-sm font-medium text-zinc-700 ${
        isLoading ? "opacity-60" : ""
      }`}
    >
      <span>{$t("overlay.showGrid")}</span>
      <span class="relative inline-flex items-center">
        <input
          id="overlay-show-grid"
          type="checkbox"
          class="peer sr-only"
          bind:checked={config.overlay.showGrid}
          onchange={onConfigMutated}
          disabled={isLoading}
        />
        <span
          class="relative h-6 w-11 rounded-full bg-zinc-300 transition peer-checked:bg-zinc-900 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30 peer-disabled:opacity-50 after:absolute after:left-[3px] after:top-1/2 after:h-4 after:w-4 after:-translate-y-1/2 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-5"
        ></span>
      </span>
    </label>

    <label
      for="overlay-show-diagonals"
      class={`inline-flex items-center gap-2.5 text-sm font-medium text-zinc-700 ${
        isLoading ? "opacity-60" : ""
      }`}
    >
      <span>{$t("overlay.showDiagonals")}</span>
      <span class="relative inline-flex items-center">
        <input
          id="overlay-show-diagonals"
          type="checkbox"
          class="peer sr-only"
          bind:checked={config.overlay.showDiagonals}
          onchange={onConfigMutated}
          disabled={isLoading}
        />
        <span
          class="relative h-6 w-11 rounded-full bg-zinc-300 transition peer-checked:bg-zinc-900 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30 peer-disabled:opacity-50 after:absolute after:left-[3px] after:top-1/2 after:h-4 after:w-4 after:-translate-y-1/2 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-5"
        ></span>
      </span>
    </label>
  </div>

  <div class="mt-6 grid gap-6 md:grid-cols-2">
    <div>
      <label class="text-sm font-medium text-zinc-700" for="overlay-alpha"
        >{$t("overlay.alpha")}</label
      >
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
    <div>
      <label class="text-sm font-medium text-zinc-700" for="overlay-line"
        >{$t("overlay.lineWidth")}</label
      >
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
    <div>
      <label class="text-sm font-medium text-zinc-700" for="overlay-font"
        >{$t("overlay.fontSizeFallback")}</label
      >
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
    <ColorField
      id="overlay-mask-color"
      label={$t("overlay.maskColor")}
      value={config.overlay.maskColor}
      disabled={isLoading}
      onChange={(next) => updateColor("maskColor", next)}
    />

    <ColorField
      id="overlay-line-color"
      label={$t("overlay.lineColor")}
      value={config.overlay.lineColor}
      disabled={isLoading}
      onChange={(next) => updateColor("lineColor", next)}
    />

    <ColorField
      id="overlay-text-color"
      label={$t("overlay.textColor")}
      value={config.overlay.textColor}
      disabled={isLoading}
      onChange={(next) => updateColor("textColor", next)}
    />

    <div>
      <label class="text-sm font-medium text-zinc-700" for="overlay-font-family"
        >{$t("overlay.fontFamily")}</label
      >
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
