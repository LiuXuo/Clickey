<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";

  type LayerMode = "single" | "combo";

  let {
    config,
    isLoading,
    fieldClass,
    selectClass,
    textAreaClass,
    onUpdateNudgeStep,
    onAddSingleLayer,
    onAddComboLayer,
    onSwitchLayerMode,
    onMoveLayer,
    onRemoveLayer,
    onUpdateSingleLayerGrid,
    onUpdateSingleLayerKeys,
    onUpdateComboStageGrid,
    onUpdateComboStageKeys,
    onUpdateLayerFontSize,
    formatKeys,
  } = $props<{
    config: AppConfig;
    isLoading: boolean;
    fieldClass: string;
    selectClass: string;
    textAreaClass: string;
    onUpdateNudgeStep: (event: Event) => void;
    onAddSingleLayer: () => void;
    onAddComboLayer: () => void;
    onSwitchLayerMode: (index: number, mode: LayerMode) => void;
    onMoveLayer: (index: number, direction: -1 | 1) => void;
    onRemoveLayer: (index: number) => void;
    onUpdateSingleLayerGrid: (
      index: number,
      field: "rows" | "cols",
      event: Event,
    ) => void;
    onUpdateSingleLayerKeys: (index: number, event: Event) => void;
    onUpdateComboStageGrid: (
      index: number,
      stage: 0 | 1,
      field: "rows" | "cols",
      event: Event,
    ) => void;
    onUpdateComboStageKeys: (index: number, stage: 0 | 1, event: Event) => void;
    onUpdateLayerFontSize: (index: number, event: Event) => void;
    formatKeys: (keys: string[]) => string;
  }>();
</script>

<SettingsCard id="layers">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <SectionHeader title={$t("layers.title")} icon="layers" />
    <div class="flex flex-wrap items-center gap-2 pt-0.5">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        onclick={onAddSingleLayer}
        disabled={isLoading}>{$t("layers.addSingle")}</button
      >
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        onclick={onAddComboLayer}
        disabled={isLoading}>{$t("layers.addCombo")}</button
      >
    </div>
  </div>

  <div class="mt-6 space-y-6">
    {#each config.layers as layer, index (index)}
      <div class="border-t border-zinc-200 pt-6 first:border-t-0 first:pt-0">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.24em] text-zinc-500">
              {$t("layers.layerLabel", { index: index + 1 })}
            </p>
            <p class="text-sm font-semibold text-zinc-900">
              {layer.mode === "single"
                ? $t("layers.type.single")
                : $t("layers.type.combo")}
            </p>
          </div>
          <div class="min-w-[140px]">
            <label
              class="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500"
              for={`layer-${index}-mode`}>{$t("layers.mode")}</label
            >
            <div class="relative mt-2">
              <select
                id={`layer-${index}-mode`}
                class={selectClass}
                value={layer.mode}
                onchange={(event) =>
                  onSwitchLayerMode(
                    index,
                    (event.currentTarget as HTMLSelectElement).value as LayerMode,
                  )}
                disabled={isLoading}
              >
                <option value="single">{$t("layers.type.single")}</option>
                <option value="combo">{$t("layers.type.combo")}</option>
              </select>
              <span
                class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 12"
                  class="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 4.5 6 1.8l3 2.7" />
                  <path d="M3 7.5 6 10.2l3-2.7" />
                </svg>
              </span>
            </div>
          </div>
          <div class="min-w-[140px]">
            <label
              class="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500"
              for={`layer-${index}-font-size`}>{$t("overlay.fontSize")}</label
            >
            <input
              id={`layer-${index}-font-size`}
              type="number"
              min="1"
              class={fieldClass}
              value={config.overlay.font.layerSizePx[index] ??
                config.overlay.font.sizePx}
              oninput={(event) => onUpdateLayerFontSize(index, event)}
              disabled={isLoading}
            />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              onclick={() => onMoveLayer(index, -1)}
              disabled={isLoading || index === 0}>{$t("layers.moveUp")}</button
            >
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              onclick={() => onMoveLayer(index, 1)}
              disabled={isLoading || index === config.layers.length - 1}
              >{$t("layers.moveDown")}</button
            >
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              onclick={() => onRemoveLayer(index)}
              disabled={isLoading || config.layers.length <= 1}
              >{$t("layers.remove")}</button
            >
          </div>
        </div>

        {#if layer.mode === "single"}
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                class="text-sm font-medium text-zinc-700"
                for={`layer-${index}-rows`}>{$t("layers.rows")}</label
              >
              <input
                id={`layer-${index}-rows`}
                type="number"
                min="1"
                class={fieldClass}
                value={layer.rows}
                oninput={(event) =>
                  onUpdateSingleLayerGrid(index, "rows", event)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                class="text-sm font-medium text-zinc-700"
                for={`layer-${index}-cols`}>{$t("layers.columns")}</label
              >
              <input
                id={`layer-${index}-cols`}
                type="number"
                min="1"
                class={fieldClass}
                value={layer.cols}
                oninput={(event) =>
                  onUpdateSingleLayerGrid(index, "cols", event)}
                disabled={isLoading}
              />
            </div>
          </div>
          <label
            class="mt-3 block text-sm font-medium text-zinc-700"
            for={`layer-${index}-keys`}>{$t("layers.keysHint")}</label
          >
          <textarea
            id={`layer-${index}-keys`}
            class={textAreaClass}
            value={formatKeys(layer.keys)}
            oninput={(event) => onUpdateSingleLayerKeys(index, event)}
            disabled={isLoading}
          ></textarea>
        {:else}
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-zinc-500">
                {$t("layers.stage0")}
              </p>
              <div class="mt-3">
                <label
                  class="text-sm font-medium text-zinc-700"
                  for={`layer-${index}-stage0-cols`}
                  >{$t("layers.columns")}</label
                >
                <input
                  id={`layer-${index}-stage0-cols`}
                  type="number"
                  min="1"
                  class={fieldClass}
                  value={layer.stage0.cols}
                  oninput={(event) =>
                    onUpdateComboStageGrid(index, 0, "cols", event)}
                  disabled={isLoading}
                />
              </div>
              <label
                class="mt-3 block text-sm font-medium text-zinc-700"
                for={`layer-${index}-stage0-keys`}
                >{$t("layers.keysHint")}</label
              >
              <textarea
                id={`layer-${index}-stage0-keys`}
                class={textAreaClass}
                value={formatKeys(layer.stage0.keys)}
                oninput={(event) => onUpdateComboStageKeys(index, 0, event)}
                disabled={isLoading}
              ></textarea>
            </div>

            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-zinc-500">
                {$t("layers.stage1")}
              </p>
              <div class="mt-3">
                <label
                  class="text-sm font-medium text-zinc-700"
                  for={`layer-${index}-stage1-rows`}>{$t("layers.rows")}</label
                >
                <input
                  id={`layer-${index}-stage1-rows`}
                  type="number"
                  min="1"
                  class={fieldClass}
                  value={layer.stage1.rows}
                  oninput={(event) =>
                    onUpdateComboStageGrid(index, 1, "rows", event)}
                  disabled={isLoading}
                />
              </div>
              <label
                class="mt-3 block text-sm font-medium text-zinc-700"
                for={`layer-${index}-stage1-keys`}
                >{$t("layers.keysHint")}</label
              >
              <textarea
                id={`layer-${index}-stage1-keys`}
                class={textAreaClass}
                value={formatKeys(layer.stage1.keys)}
                oninput={(event) => onUpdateComboStageKeys(index, 1, event)}
                disabled={isLoading}
              ></textarea>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="mt-6 max-w-xs border-t border-zinc-200 pt-6">
    <label class="text-sm font-medium text-zinc-700" for="nudge-step"
      >{$t("nudge.step")}</label
    >
    <input
      id="nudge-step"
      type="number"
      min="1"
      class={fieldClass}
      value={config.nudge.stepPx}
      oninput={onUpdateNudgeStep}
      disabled={isLoading}
    />
  </div>
</SettingsCard>
