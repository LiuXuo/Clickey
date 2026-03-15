<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";
  import GridKeyTableEditor from "$lib/features/settings/ui/GridKeyTableEditor.svelte";
  import ComboKeyTableEditor from "$lib/features/settings/ui/ComboKeyTableEditor.svelte";
  import { controlButtonMdClass } from "$lib/features/settings/ui/control-classes";
  import FieldLabel from "$lib/features/settings/ui/FieldLabel.svelte";

  type LayerMode = "single" | "combo";

  let {
    config,
    isLoading,
    fieldClass,
    selectClass,
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

  const actionIconButtonClass = "settings-icon-button";
  const removeIconButtonClass = "settings-icon-button";
</script>

<SettingsCard id="layers">
  <SectionHeader title={$t("layers.title")} icon="layers" />

  <div class="mt-6 space-y-5">
    {#each config.layers as layer, index (index)}
      <div class="settings-panel rounded-xl p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="settings-text-muted text-xs uppercase tracking-[0.24em]">
              {$t("layers.layerLabel", { index: index + 1 })}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-1">
            <button
              type="button"
              class={actionIconButtonClass}
              onclick={() => onMoveLayer(index, -1)}
              disabled={isLoading || index === 0}
              aria-label={$t("layers.moveUp")}
              title={$t("layers.moveUp")}
            >
              <AppIcon name="moveUp" size={14} />
            </button>
            <button
              type="button"
              class={actionIconButtonClass}
              onclick={() => onMoveLayer(index, 1)}
              disabled={isLoading || index === config.layers.length - 1}
              aria-label={$t("layers.moveDown")}
              title={$t("layers.moveDown")}
            >
              <AppIcon name="moveDown" size={14} />
            </button>
            <button
              type="button"
              class={removeIconButtonClass}
              data-tone="danger"
              onclick={() => onRemoveLayer(index)}
              disabled={isLoading || config.layers.length <= 1}
              aria-label={$t("layers.remove")}
              title={$t("layers.remove")}
            >
              <AppIcon name="remove" size={14} />
            </button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel
              text={$t("layers.mode")}
              icon="mode"
              forId={`layer-${index}-mode`}
            />
            <div class="relative mt-2">
              <select
                id={`layer-${index}-mode`}
                class={selectClass}
                value={layer.mode}
                onchange={(event) =>
                  onSwitchLayerMode(
                    index,
                    (event.currentTarget as HTMLSelectElement)
                      .value as LayerMode,
                  )}
                disabled={isLoading}
              >
                <option value="single">{$t("layers.type.single")}</option>
                <option value="combo">{$t("layers.type.combo")}</option>
              </select>
              <span
                class="pointer-events-none absolute inset-y-0 right-3 flex items-center settings-text-muted"
              >
                <AppIcon name="selectArrows" size={14} strokeWidth={1.8} />
              </span>
            </div>
          </div>
          <div>
            <FieldLabel
              text={$t("overlay.fontSize")}
              icon="font"
              forId={`layer-${index}-font-size`}
            />
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
                <FieldLabel
                  text={$t("layers.rows")}
                  icon="rows"
                  forId={`layer-${index}-rows`}
                />
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
                <FieldLabel
                  text={$t("layers.columns")}
                  icon="columns"
                  forId={`layer-${index}-cols`}
                />
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
            <div class="mt-3">
              <FieldLabel
                text={$t("layers.keys")}
                icon="keys"
                element="p"
                className="mb-2"
              />
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
                <FieldLabel
                  text={`${$t("layers.stage1")} / ${$t("layers.rows")}`}
                  icon="rows"
                  forId={`layer-${index}-stage1-rows`}
                />
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
              <div>
                <FieldLabel
                  text={`${$t("layers.stage0")} / ${$t("layers.columns")}`}
                  icon="columns"
                  forId={`layer-${index}-stage0-cols`}
                />
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
            </div>
            <div class="mt-3">
              <FieldLabel
                text={$t("layers.keys")}
                icon="keys"
                element="p"
                className="mb-2"
              />
              <ComboKeyTableEditor
                idPrefix={`layer-${index}-combo`}
                columnKeys={normalizeSlotKeys(
                  layer.stage0.keys,
                  stage0Expected,
                )}
                rowKeys={normalizeSlotKeys(layer.stage1.keys, stage1Expected)}
                disabled={isLoading}
                onColumnKeysChange={(keys) =>
                  onUpdateComboStageKeys(index, 0, keys)}
                onRowKeysChange={(keys) =>
                  onUpdateComboStageKeys(index, 1, keys)}
              />
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class={`${controlButtonMdClass} w-full`}
        onclick={onAddSingleLayer}
        disabled={isLoading}
      >
        <AppIcon name="addSingle" size={16} />
        {$t("layers.addSingle")}
      </button>
      <button
        type="button"
        class={`${controlButtonMdClass} w-full`}
        onclick={onAddComboLayer}
        disabled={isLoading}
      >
        <AppIcon name="addCombo" size={16} />
        {$t("layers.addCombo")}
      </button>
    </div>
  </div>
</SettingsCard>
