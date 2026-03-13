<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import GridKeyTableEditor from "$lib/features/settings/ui/GridKeyTableEditor.svelte";
  import ComboKeyTableEditor from "$lib/features/settings/ui/ComboKeyTableEditor.svelte";
  import {
    controlButtonMdClass,
    controlButtonSmClass,
    controlInputSpaceItemClass,
  } from "$lib/features/settings/ui/control-classes";

  type LayerMode = "single" | "combo";

  let {
    config,
    isLoading,
    fieldClass,
    selectClass,
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
  } = $props<{
    config: AppConfig;
    isLoading: boolean;
    fieldClass: string;
    selectClass: string;
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
    onUpdateSingleLayerKeys: (index: number, keys: string[]) => void;
    onUpdateComboStageGrid: (
      index: number,
      stage: 0 | 1,
      field: "rows" | "cols",
      event: Event,
    ) => void;
    onUpdateComboStageKeys: (
      index: number,
      stage: 0 | 1,
      keys: string[],
    ) => void;
    onUpdateLayerFontSize: (index: number, event: Event) => void;
  }>();

  function normalizeSlotToken(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return "";
    }
    const [first] = Array.from(trimmed);
    return (first ?? "").toLowerCase();
  }

  function normalizeSlotKeys(keys: string[], count: number): string[] {
    const normalized: string[] = [];
    for (let index = 0; index < count; index += 1) {
      normalized.push(normalizeSlotToken(keys[index] ?? ""));
    }
    return normalized;
  }

  const removeButtonClass = `${controlButtonSmClass} border-rose-200 text-rose-700 hover:border-rose-300 hover:text-rose-800`;
</script>

<SettingsCard id="layers">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <SectionHeader title={$t("layers.title")} icon="layers" />
    <div class="flex flex-wrap items-center gap-2 pt-0.5">
      <button
        type="button"
        class={controlButtonMdClass}
        onclick={onAddSingleLayer}
        disabled={isLoading}>{$t("layers.addSingle")}</button
      >
      <button
        type="button"
        class={controlButtonMdClass}
        onclick={onAddComboLayer}
        disabled={isLoading}>{$t("layers.addCombo")}</button
      >
    </div>
  </div>

  <div class="mt-6 space-y-5">
    {#each config.layers as layer, index (index)}
      <div class="rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-[0.24em] text-zinc-500">
              {$t("layers.layerLabel", { index: index + 1 })}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class={controlButtonSmClass}
              onclick={() => onMoveLayer(index, -1)}
              disabled={isLoading || index === 0}>{$t("layers.moveUp")}</button
            >
            <button
              type="button"
              class={controlButtonSmClass}
              onclick={() => onMoveLayer(index, 1)}
              disabled={isLoading || index === config.layers.length - 1}
              >{$t("layers.moveDown")}</button
            >
            <button
              type="button"
              class={removeButtonClass}
              onclick={() => onRemoveLayer(index)}
              disabled={isLoading || config.layers.length <= 1}
              >{$t("layers.remove")}</button
            >
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm font-medium text-zinc-700" for={`layer-${index}-mode`}
              >{$t("layers.mode")}</label
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
          <div>
            <label class="text-sm font-medium text-zinc-700" for={`layer-${index}-font-size`}
              >{$t("overlay.fontSize")}</label
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
        </div>

        {#if layer.mode === "single"}
          {@const expected = layer.rows * layer.cols}
          <div class="mt-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="text-sm font-medium text-zinc-700" for={`layer-${index}-rows`}
                  >{$t("layers.rows")}</label
                >
                <input
                  id={`layer-${index}-rows`}
                  type="number"
                  min="1"
                  class={fieldClass}
                  value={layer.rows}
                  oninput={(event) => onUpdateSingleLayerGrid(index, "rows", event)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label class="text-sm font-medium text-zinc-700" for={`layer-${index}-cols`}
                  >{$t("layers.columns")}</label
                >
                <input
                  id={`layer-${index}-cols`}
                  type="number"
                  min="1"
                  class={fieldClass}
                  value={layer.cols}
                  oninput={(event) => onUpdateSingleLayerGrid(index, "cols", event)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div class="mt-3">
              <GridKeyTableEditor
                idPrefix={`layer-${index}-keys`}
                rows={layer.rows}
                cols={layer.cols}
                keys={normalizeSlotKeys(layer.keys, expected)}
                disabled={isLoading}
                onChange={(keys) => onUpdateSingleLayerKeys(index, keys)}
              />
            </div>
          </div>
        {:else}
          {@const stage0Expected = layer.stage0.rows * layer.stage0.cols}
          {@const stage1Expected = layer.stage1.rows * layer.stage1.cols}
          <div class="mt-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  class="text-sm font-medium text-zinc-700"
                  for={`layer-${index}-stage1-rows`}
                  >{$t("layers.stage1")} / {$t("layers.rows")}</label
                >
                <input
                  id={`layer-${index}-stage1-rows`}
                  type="number"
                  min="1"
                  class={fieldClass}
                  value={layer.stage1.rows}
                  oninput={(event) => onUpdateComboStageGrid(index, 1, "rows", event)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label
                  class="text-sm font-medium text-zinc-700"
                  for={`layer-${index}-stage0-cols`}
                  >{$t("layers.stage0")} / {$t("layers.columns")}</label
                >
                <input
                  id={`layer-${index}-stage0-cols`}
                  type="number"
                  min="1"
                  class={fieldClass}
                  value={layer.stage0.cols}
                  oninput={(event) => onUpdateComboStageGrid(index, 0, "cols", event)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div class="mt-3">
              <ComboKeyTableEditor
                idPrefix={`layer-${index}-combo`}
                columnKeys={normalizeSlotKeys(layer.stage0.keys, stage0Expected)}
                rowKeys={normalizeSlotKeys(layer.stage1.keys, stage1Expected)}
                disabled={isLoading}
                onColumnKeysChange={(keys) => onUpdateComboStageKeys(index, 0, keys)}
                onRowKeysChange={(keys) => onUpdateComboStageKeys(index, 1, keys)}
              />
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="mt-6 border-t border-zinc-200 pt-6">
    <div class={controlInputSpaceItemClass}>
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
  </div>
</SettingsCard>
