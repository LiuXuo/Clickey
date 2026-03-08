<script lang="ts">
  import { t } from "$lib/i18n";
  import type { AppConfig } from "$lib/core";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";
  import SectionHeader from "$lib/features/settings/ui/SectionHeader.svelte";

  let { config, isLoading, fieldClass, onConfigMutated } = $props<{
    config: AppConfig;
    isLoading: boolean;
    fieldClass: string;
    onConfigMutated: () => void;
  }>();

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
</script>

<SettingsCard id="mouse">
  <SectionHeader title={$t("mouse.title")} icon="mouse" />

  <div class="mt-6">
    <label
      for="mouse-smooth-move"
      class={`inline-flex items-center gap-2.5 text-sm font-medium text-zinc-700 ${
        isLoading ? "opacity-60" : ""
      }`}
    >
      <span>{$t("mouse.smoothMove")}</span>
      <span class="relative inline-flex items-center">
        <input
          id="mouse-smooth-move"
          type="checkbox"
          class="peer sr-only"
          bind:checked={config.mouse.smoothMove}
          onchange={onConfigMutated}
          disabled={isLoading}
        />
        <span
          class="relative h-6 w-11 rounded-full bg-zinc-300 transition peer-checked:bg-zinc-900 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30 peer-disabled:opacity-50 after:absolute after:left-[3px] after:top-1/2 after:h-4 after:w-4 after:-translate-y-1/2 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-5"
        ></span>
      </span>
    </label>
  </div>

  {#if config.mouse.smoothMove}
    <div class="mt-6 grid gap-6 md:grid-cols-2">
    <div>
      <label class="text-sm font-medium text-zinc-700" for="mouse-duration"
        >{$t("mouse.moveDurationMs")}</label
      >
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
      <label class="text-sm font-medium text-zinc-700" for="mouse-step-ms"
        >{$t("mouse.moveStepMs")}</label
      >
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
      <label class="text-sm font-medium text-zinc-700" for="mouse-press-ms"
        >{$t("mouse.pressDurationMs")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-landing-radius">{$t("mouse.landingRadiusPx")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-duration-randomness">{$t("mouse.durationRandomness")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-step-randomness">{$t("mouse.stepRandomness")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-distance-boost-px">{$t("mouse.distanceBoostPx")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-duration-distance-boost"
        >{$t("mouse.durationDistanceBoost")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-step-distance-boost">{$t("mouse.stepDistanceBoost")}</label
      >
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
      <label class="text-sm font-medium text-zinc-700" for="mouse-curve-along"
        >{$t("mouse.curveAlongRatio")}</label
      >
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
      <label class="text-sm font-medium text-zinc-700" for="mouse-curve-spread"
        >{$t("mouse.curveSpreadRatio")}</label
      >
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
      <label class="text-sm font-medium text-zinc-700" for="mouse-jitter"
        >{$t("mouse.jitterRatio")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-adaptive-stride-base"
        >{$t("mouse.adaptiveStrideBasePx")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-adaptive-stride-ratio"
        >{$t("mouse.adaptiveStrideDistanceRatio")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-adaptive-stride-max">{$t("mouse.adaptiveStrideMaxPx")}</label
      >
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
      <label class="text-sm font-medium text-zinc-700" for="mouse-extra-steps"
        >{$t("mouse.extraStepsMax")}</label
      >
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
      <label class="text-sm font-medium text-zinc-700" for="mouse-max-steps"
        >{$t("mouse.maxSteps")}</label
      >
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
      <label
        class="text-sm font-medium text-zinc-700"
        for="mouse-max-step-sleep">{$t("mouse.maxStepSleepMs")}</label
      >
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
