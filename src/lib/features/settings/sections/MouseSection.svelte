<script lang="ts">
  import { flip } from "svelte/animate";
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  import { t } from "$lib/i18n";
  import type { AppConfig, MouseAction } from "$lib/core";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";
  import AppIcon from "$lib/features/settings/ui/AppIcon.svelte";
  import {
    controlChipTextClass,
    controlInputSpaceWrapClass,
    switchTrackClass,
  } from "$lib/features/settings/ui/control-classes";
  import FieldLabel from "$lib/features/settings/ui/FieldLabel.svelte";

  let { config, isLoading, fieldClass, onConfigMutated } = $props<{
    config: AppConfig;
    isLoading: boolean;
    fieldClass: string;
    onConfigMutated: () => void;
  }>();

  const availableActions: MouseAction[] = [
    "left",
    "right",
    "middle",
    "moveOnly",
    "doubleLeft",
    "ctrlLeft",
    "cmdLeft",
    "shiftLeft",
  ];
  const flipDurationMs = 160;

  type ActionItem = {
    id: MouseAction;
    enabled: boolean;
  };

  let orderedActionItems = $derived(orderedActionsFromConfig());
  let enabledActionCount = $derived(
    orderedActionItems.filter((item) => item.enabled).length,
  );
  let dragDisabled = $derived(isLoading || orderedActionItems.length <= 1);

  function toPositiveInt(value: string, fallback: number): number {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function toNonNegativeInt(value: string, fallback: number): number {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  function clampNumber(
    value: string,
    min: number,
    max: number,
    fallback: number,
  ): number {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(Math.max(parsed, min), max);
  }

  function actionLabel(action: MouseAction): string {
    switch (action) {
      case "left":
        return $t("overlay.action.left");
      case "right":
        return $t("overlay.action.right");
      case "middle":
        return $t("overlay.action.middle");
      case "moveOnly":
        return $t("overlay.action.moveOnly");
      case "doubleLeft":
        return $t("overlay.action.doubleLeft");
      case "ctrlLeft":
        return $t("overlay.action.ctrlLeft");
      case "cmdLeft":
        return $t("overlay.action.cmdLeft");
      case "shiftLeft":
        return $t("overlay.action.shiftLeft");
    }
  }

  function normalizedOrder(): MouseAction[] {
    const next: MouseAction[] = [];
    for (const action of config.mouse.actionCycle) {
      if (!availableActions.includes(action) || next.includes(action)) {
        continue;
      }
      next.push(action);
    }
    for (const action of availableActions) {
      if (!next.includes(action)) {
        next.push(action);
      }
    }
    return next;
  }

  function toActionItems(
    order: MouseAction[],
    disabledActions: MouseAction[],
  ): ActionItem[] {
    const disabled = new Set(disabledActions);
    return order.map((action) => ({
      id: action,
      enabled: !disabled.has(action),
    }));
  }

  function orderedActionsFromConfig(): ActionItem[] {
    return toActionItems(normalizedOrder(), config.mouse.disabledActions ?? []);
  }

  function commitActionLayout(next: ActionItem[]) {
    config.mouse.actionCycle = next.map((item) => item.id);
    config.mouse.disabledActions = next
      .filter((item) => !item.enabled)
      .map((item) => item.id);
    orderedActionItems = orderedActionsFromConfig();
    onConfigMutated();
  }

  function toggleActionEnabled(action: MouseAction) {
    const next = orderedActionItems.map((item) =>
      item.id === action ? { ...item, enabled: !item.enabled } : item,
    );
    if (next.every((item) => !item.enabled)) {
      return;
    }
    commitActionLayout(next);
  }

  function handleActionConsider(event: CustomEvent<DndEvent<ActionItem>>) {
    orderedActionItems = event.detail.items;
  }

  function handleActionFinalize(event: CustomEvent<DndEvent<ActionItem>>) {
    commitActionLayout(event.detail.items);
  }
</script>

<SettingsCard id="mouse">
  <SectionHeader title={$t("mouse.title")} icon="mouse" />

  <div class="settings-panel-muted mt-6 rounded-xl p-4">
    <div class="max-w-2xl">
      <p
        class="settings-text-primary inline-flex items-center gap-2 text-sm font-semibold"
      >
        <AppIcon name="actionCycle" size={16} className="settings-text-muted" />
        {$t("mouse.actionCycle")}
      </p>
      <p class="settings-text-muted mt-1 text-sm">
        {$t("mouse.actionCycleHint")}
      </p>
    </div>

    <div
      class="mt-4 flex flex-wrap gap-2"
      role="list"
      aria-label={$t("mouse.actionCycle")}
      use:dndzone={{
        items: orderedActionItems,
        flipDurationMs,
        dragDisabled,
        delayTouchStart: true,
      }}
      onconsider={handleActionConsider}
      onfinalize={handleActionFinalize}
    >
      {#each orderedActionItems as item (item.id)}
        <div
          role="listitem"
          aria-label={actionLabel(item.id)}
          animate:flip={{ duration: flipDurationMs }}
          class={`settings-action-chip flex flex-none items-center gap-2 rounded-lg px-3 py-2 transition ${
            dragDisabled
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing"
          }`}
          data-enabled={item.enabled}
        >
          <AppIcon
            name="dragHandle"
            size={14}
            className={item.enabled
              ? "settings-text-faint"
              : "settings-text-muted"}
          />
          <p
            class={`${controlChipTextClass} ${
              item.enabled ? "settings-text-primary" : "settings-text-muted"
            }`}
          >
            {actionLabel(item.id)}
          </p>

          <div class="flex flex-wrap items-center gap-2">
            <label
              class={`inline-flex items-center ${isLoading ? "opacity-60" : ""}`}
              for={`mouse-action-${item.id}`}
            >
              <input
                id={`mouse-action-${item.id}`}
                type="checkbox"
                class="peer sr-only"
                checked={item.enabled}
                onchange={() => toggleActionEnabled(item.id)}
                disabled={isLoading ||
                  (item.enabled && enabledActionCount === 1)}
              />
              <span class={switchTrackClass}></span>
            </label>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="mt-6">
    <label
      for="mouse-smooth-move"
      class={`settings-text-secondary inline-flex items-center gap-2.5 text-sm font-medium ${
        isLoading ? "opacity-60" : ""
      }`}
    >
      <span class="inline-flex items-center gap-2">
        <AppIcon
          name="smoothMove"
          size={15}
          strokeWidth={2.1}
          className="settings-icon-muted"
        />
        <span>{$t("mouse.smoothMove")}</span>
        <span
          class="settings-text-muted inline-flex h-4 w-4 items-center justify-center rounded-full transition hover:opacity-100"
          title={$t("mouse.smoothMoveHelp")}
        >
          <AppIcon name="help" size={14} strokeWidth={2.1} />
        </span>
      </span>
      <span class="relative inline-flex items-center">
        <input
          id="mouse-smooth-move"
          type="checkbox"
          class="peer sr-only"
          bind:checked={config.mouse.smoothMove}
          onchange={onConfigMutated}
          disabled={isLoading}
        />
        <span class={switchTrackClass}></span>
      </span>
    </label>
  </div>

  {#if config.mouse.smoothMove}
    <div class={`mt-6 gap-6 ${controlInputSpaceWrapClass}`}>
      <div>
        <FieldLabel
          text={$t("mouse.moveDurationMs")}
          icon="duration"
          forId="mouse-duration"
        />
        <input
          id="mouse-duration"
          type="number"
          min="1"
          class={fieldClass}
          value={config.mouse.moveDurationMs}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.moveDurationMs = toPositiveInt(
              target.value,
              config.mouse.moveDurationMs,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.moveStepMs")}
          icon="step"
          forId="mouse-step-ms"
        />
        <input
          id="mouse-step-ms"
          type="number"
          min="1"
          class={fieldClass}
          value={config.mouse.moveStepMs}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.moveStepMs = toPositiveInt(
              target.value,
              config.mouse.moveStepMs,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.pressDurationMs")}
          icon="press"
          forId="mouse-press-ms"
        />
        <input
          id="mouse-press-ms"
          type="number"
          min="0"
          class={fieldClass}
          value={config.mouse.pressDurationMs}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.pressDurationMs = toNonNegativeInt(
              target.value,
              config.mouse.pressDurationMs,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.landingRadiusPx")}
          icon="landing"
          forId="mouse-landing-radius"
        />
        <input
          id="mouse-landing-radius"
          type="number"
          min="0"
          class={fieldClass}
          value={config.mouse.landingRadiusPx}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.landingRadiusPx = toNonNegativeInt(
              target.value,
              config.mouse.landingRadiusPx,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.durationRandomness")}
          icon="randomness"
          forId="mouse-duration-randomness"
        />
        <input
          id="mouse-duration-randomness"
          type="number"
          min="0"
          max="0.95"
          step="0.01"
          class={fieldClass}
          value={config.mouse.durationRandomness}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.durationRandomness = clampNumber(
              target.value,
              0,
              0.95,
              config.mouse.durationRandomness,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.stepRandomness")}
          icon="randomness"
          forId="mouse-step-randomness"
        />
        <input
          id="mouse-step-randomness"
          type="number"
          min="0"
          max="0.95"
          step="0.01"
          class={fieldClass}
          value={config.mouse.stepRandomness}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.stepRandomness = clampNumber(
              target.value,
              0,
              0.95,
              config.mouse.stepRandomness,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.distanceBoostPx")}
          icon="distance"
          forId="mouse-distance-boost-px"
        />
        <input
          id="mouse-distance-boost-px"
          type="number"
          min="1"
          step="1"
          class={fieldClass}
          value={config.mouse.distanceBoostPx}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.distanceBoostPx = clampNumber(
              target.value,
              1,
              100000,
              config.mouse.distanceBoostPx,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.durationDistanceBoost")}
          icon="distance"
          forId="mouse-duration-distance-boost"
        />
        <input
          id="mouse-duration-distance-boost"
          type="number"
          min="0"
          max="0.95"
          step="0.01"
          class={fieldClass}
          value={config.mouse.durationDistanceBoost}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.durationDistanceBoost = clampNumber(
              target.value,
              0,
              0.95,
              config.mouse.durationDistanceBoost,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.stepDistanceBoost")}
          icon="distance"
          forId="mouse-step-distance-boost"
        />
        <input
          id="mouse-step-distance-boost"
          type="number"
          min="0"
          max="0.95"
          step="0.01"
          class={fieldClass}
          value={config.mouse.stepDistanceBoost}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.stepDistanceBoost = clampNumber(
              target.value,
              0,
              0.95,
              config.mouse.stepDistanceBoost,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.curveAlongRatio")}
          icon="curve"
          forId="mouse-curve-along"
        />
        <input
          id="mouse-curve-along"
          type="number"
          min="0"
          max="1"
          step="0.01"
          class={fieldClass}
          value={config.mouse.curveAlongRatio}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.curveAlongRatio = clampNumber(
              target.value,
              0,
              1,
              config.mouse.curveAlongRatio,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.curveSpreadRatio")}
          icon="curve"
          forId="mouse-curve-spread"
        />
        <input
          id="mouse-curve-spread"
          type="number"
          min="0"
          max="1"
          step="0.01"
          class={fieldClass}
          value={config.mouse.curveSpreadRatio}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.curveSpreadRatio = clampNumber(
              target.value,
              0,
              1,
              config.mouse.curveSpreadRatio,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.jitterRatio")}
          icon="jitter"
          forId="mouse-jitter"
        />
        <input
          id="mouse-jitter"
          type="number"
          min="0"
          max="0.2"
          step="0.001"
          class={fieldClass}
          value={config.mouse.jitterRatio}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.jitterRatio = clampNumber(
              target.value,
              0,
              0.2,
              config.mouse.jitterRatio,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.adaptiveStrideBasePx")}
          icon="stride"
          forId="mouse-adaptive-stride-base"
        />
        <input
          id="mouse-adaptive-stride-base"
          type="number"
          min="0.1"
          step="0.1"
          class={fieldClass}
          value={config.mouse.adaptiveStrideBasePx}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.adaptiveStrideBasePx = clampNumber(
              target.value,
              0.1,
              500,
              config.mouse.adaptiveStrideBasePx,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.adaptiveStrideDistanceRatio")}
          icon="stride"
          forId="mouse-adaptive-stride-ratio"
        />
        <input
          id="mouse-adaptive-stride-ratio"
          type="number"
          min="0"
          max="1"
          step="0.001"
          class={fieldClass}
          value={config.mouse.adaptiveStrideDistanceRatio}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.adaptiveStrideDistanceRatio = clampNumber(
              target.value,
              0,
              1,
              config.mouse.adaptiveStrideDistanceRatio,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.adaptiveStrideMaxPx")}
          icon="stride"
          forId="mouse-adaptive-stride-max"
        />
        <input
          id="mouse-adaptive-stride-max"
          type="number"
          min={config.mouse.adaptiveStrideBasePx}
          step="0.1"
          class={fieldClass}
          value={config.mouse.adaptiveStrideMaxPx}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.adaptiveStrideMaxPx = clampNumber(
              target.value,
              config.mouse.adaptiveStrideBasePx,
              1000,
              config.mouse.adaptiveStrideMaxPx,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.extraStepsMax")}
          icon="maxSteps"
          forId="mouse-extra-steps"
        />
        <input
          id="mouse-extra-steps"
          type="number"
          min="0"
          class={fieldClass}
          value={config.mouse.extraStepsMax}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.extraStepsMax = toNonNegativeInt(
              target.value,
              config.mouse.extraStepsMax,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.maxSteps")}
          icon="maxSteps"
          forId="mouse-max-steps"
        />
        <input
          id="mouse-max-steps"
          type="number"
          min="2"
          class={fieldClass}
          value={config.mouse.maxSteps}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.maxSteps = Math.max(
              2,
              toPositiveInt(target.value, config.mouse.maxSteps),
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
      <div>
        <FieldLabel
          text={$t("mouse.maxStepSleepMs")}
          icon="maxSteps"
          forId="mouse-max-step-sleep"
        />
        <input
          id="mouse-max-step-sleep"
          type="number"
          min="1"
          class={fieldClass}
          value={config.mouse.maxStepSleepMs}
          oninput={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            config.mouse.maxStepSleepMs = toPositiveInt(
              target.value,
              config.mouse.maxStepSleepMs,
            );
            onConfigMutated();
          }}
          disabled={isLoading}
        />
      </div>
    </div>
  {/if}
</SettingsCard>
