<script lang="ts">
  import { applyKey, createInitialState, getCurrentStep } from "$lib/core";
  import type { AppConfig, CurrentStep, Region, RuntimeState } from "$lib/core";
  import { t } from "$lib/i18n";
  import { formatHotkeyDisplay } from "$lib/features/settings/hotkey-utils";
  import {
    PLAYGROUND_REGION,
    createPlaygroundChallenge,
    isBubbleHit,
    type PlaygroundChallenge,
  } from "$lib/features/settings/playground";
  import SettingsCard from "$lib/features/settings/ui/SettingsCard.svelte";

  type RoundOutcome = "ready" | "success" | "miss" | "cancel";
  type DisplayGrid = {
    rows: number;
    cols: number;
    keys: string[];
  };
  const AUTO_ADVANCE_DELAY_MS = 420;
  const PLAYGROUND_FONT_SCALE = 0.7;

  let { appliedConfig, isLoading, isActive } = $props<{
    appliedConfig: AppConfig;
    isLoading: boolean;
    isActive: boolean;
  }>();

  let challenge = $state<PlaygroundChallenge | null>(null);
  let runtime = $state<RuntimeState | null>(null);
  let roundOutcome = $state<RoundOutcome>("ready");
  let stepCount = $state(0);
  let hasBoardFocus = $state(false);
  let boardElement: HTMLDivElement | null = null;
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;

  const currentStep = $derived(
    runtime ? getCurrentStep(appliedConfig, runtime) : null,
  );
  const displayGrid = $derived(
    currentStep && runtime
      ? getDisplayGrid(appliedConfig, runtime, currentStep)
      : null,
  );
  const boardPrompt = $derived(resolveBoardPrompt());
  const showOverlay = $derived(
    !hasBoardFocus ||
      roundOutcome === "success" ||
      roundOutcome === "miss" ||
      roundOutcome === "cancel",
  );
  const boardStyle = $derived(resolveBoardStyle(appliedConfig));
  const overlayLineWidth = $derived(resolveLineWidth(appliedConfig));
  const showDiagonals = $derived(appliedConfig.overlay.showDiagonals);
  const regionVisualStyle = $derived(
    runtime ? resolveRegionVisualStyle(appliedConfig, runtime) : "",
  );

  function withAlpha(color: string, alpha: number, fallback: string): string {
    if (!color.startsWith("#")) {
      return fallback;
    }

    const hex = color.slice(1);
    if (hex.length !== 6) {
      return fallback;
    }

    const channel = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${channel}`;
  }

  function formatLayerKey(value: string): string {
    if (value === " ") {
      return "Space";
    }
    if (value.length === 1) {
      return /^[a-z]$/i.test(value) ? value.toUpperCase() : value;
    }

    return formatHotkeyDisplay(value) || value;
  }

  function getDisplayGrid(
    config: AppConfig,
    state: RuntimeState,
    step: CurrentStep,
  ): DisplayGrid {
    if (step.mode !== "combo" || step.stage !== 0) {
      return {
        rows: step.rows,
        cols: step.cols,
        keys: step.keys.map(formatLayerKey),
      };
    }

    const layer = config.layers[state.layerIndex];
    if (!layer || layer.mode !== "combo") {
      return {
        rows: step.rows,
        cols: step.cols,
        keys: step.keys.map(formatLayerKey),
      };
    }

    const rowKeys = layer.stage1.keys;
    const colKeys = layer.stage0.keys;
    if (!rowKeys.length || !colKeys.length) {
      return {
        rows: step.rows,
        cols: step.cols,
        keys: step.keys.map(formatLayerKey),
      };
    }

    const labels: string[] = [];
    for (const rowKey of rowKeys) {
      for (const colKey of colKeys) {
        labels.push(`${formatLayerKey(colKey)}${formatLayerKey(rowKey)}`);
      }
    }

    return {
      rows: rowKeys.length,
      cols: colKeys.length,
      keys: labels,
    };
  }

  function resolveLineWidth(config: AppConfig): number {
    return Math.max(1, Math.round(config.overlay.lineWidthPx));
  }

  function resolveLayerFontSize(
    config: AppConfig,
    runtime: RuntimeState,
  ): number {
    const fallback = Math.max(1, Math.round(config.overlay.font.sizePx));
    const perLayer = config.overlay.font.layerSizePx;
    if (!Array.isArray(perLayer)) {
      return fallback;
    }
    const candidate = perLayer[runtime.layerIndex];
    if (!Number.isFinite(candidate) || candidate <= 0) {
      return Math.max(1, Math.round(fallback * PLAYGROUND_FONT_SCALE));
    }
    return Math.max(1, Math.round(candidate * PLAYGROUND_FONT_SCALE));
  }

  function resolveBoardStyle(config: AppConfig): string {
    const alpha = Math.min(Math.max(config.overlay.alpha, 0), 255) / 255;
    const mask = withAlpha(
      config.overlay.maskColor,
      alpha,
      "rgba(0, 0, 0, 0.72)",
    );
    const overlayFill = withAlpha(
      config.overlay.maskColor,
      Math.min(alpha + 0.18, 0.98),
      "rgba(0, 0, 0, 0.88)",
    );
    const lineSoft = withAlpha(
      config.overlay.lineColor,
      0.24,
      "rgba(255, 255, 255, 0.24)",
    );
    const lineFaint = withAlpha(
      config.overlay.lineColor,
      0.14,
      "rgba(255, 255, 255, 0.14)",
    );
    const lineWidth = resolveLineWidth(config);

    return [
      `background:${mask}`,
      `border-color:${lineSoft}`,
      `color:${config.overlay.textColor}`,
      `--playground-line-color:${config.overlay.lineColor}`,
      `--playground-line-soft:${lineSoft}`,
      `--playground-line-faint:${lineFaint}`,
      `--playground-line-width:${lineWidth}px`,
      `--playground-text-color:${config.overlay.textColor}`,
      `--playground-overlay-fill:${overlayFill}`,
    ].join(";");
  }

  function resolveRegionVisualStyle(
    config: AppConfig,
    runtime: RuntimeState,
  ): string {
    const lineColor = config.overlay.showGrid
      ? config.overlay.lineColor
      : "transparent";
    const cellBorder = config.overlay.showGrid
      ? "var(--playground-line-faint)"
      : "transparent";
    const fontSize = resolveLayerFontSize(config, runtime);
    const fontFamily = config.overlay.font.family.trim() || "sans-serif";

    return [
      `border-color:${lineColor}`,
      `--playground-cell-border:${cellBorder}`,
      `--playground-font-size:${fontSize}px`,
      `--playground-font-family:${fontFamily}`,
    ].join(";");
  }

  function regionStyle(region: Region): string {
    const left =
      ((region.x - PLAYGROUND_REGION.x) / PLAYGROUND_REGION.width) * 100;
    const top =
      ((region.y - PLAYGROUND_REGION.y) / PLAYGROUND_REGION.height) * 100;
    const width = (region.width / PLAYGROUND_REGION.width) * 100;
    const height = (region.height / PLAYGROUND_REGION.height) * 100;

    return `left:${left}%;top:${top}%;width:${width}%;height:${height}%;`;
  }

  function bubbleStyle(
    target: PlaygroundChallenge,
    outcome: RoundOutcome,
  ): string {
    const left =
      ((target.clickPoint.x - PLAYGROUND_REGION.x) / PLAYGROUND_REGION.width) *
      100;
    const top =
      ((target.clickPoint.y - PLAYGROUND_REGION.y) / PLAYGROUND_REGION.height) *
      100;
    const width = (target.bubbleRadiusPx * 2 * 100) / PLAYGROUND_REGION.width;
    const height = (target.bubbleRadiusPx * 2 * 100) / PLAYGROUND_REGION.height;

    let fill = "rgba(251, 191, 36, 0.92)";
    let glow = "rgba(245, 158, 11, 0.22)";
    if (outcome === "success") {
      fill = "rgba(34, 197, 94, 0.92)";
      glow = "rgba(34, 197, 94, 0.24)";
    } else if (outcome === "miss") {
      fill = "rgba(244, 63, 94, 0.88)";
      glow = "rgba(244, 63, 94, 0.22)";
    }

    return `left:${left}%;top:${top}%;width:${width}%;height:${height}%;--playground-bubble-fill:${fill};--playground-bubble-glow:${glow};`;
  }

  function resolveBoardPrompt(): string {
    if (roundOutcome === "success") {
      return $t("playground.result.success");
    }
    if (roundOutcome === "miss") {
      return $t("playground.result.miss");
    }
    if (roundOutcome === "cancel") {
      return $t("playground.result.cancel");
    }
    if (stepCount > 0) {
      if (hasBoardFocus) {
        return $t("playground.prompt.continue");
      }
      return $t("playground.prompt.resume");
    }
    if (hasBoardFocus) {
      return $t("playground.prompt.active");
    }
    return $t("playground.prompt.ready");
  }

  function focusBoard() {
    if (!boardElement || isLoading) {
      return;
    }

    queueMicrotask(() => {
      boardElement?.focus();
    });
  }

  function blurBoard() {
    boardElement?.blur();
    hasBoardFocus = false;
  }

  function clearAutoAdvanceTimer() {
    if (!autoAdvanceTimer) {
      return;
    }

    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }

  function scheduleNextChallenge() {
    clearAutoAdvanceTimer();
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      prepareNextChallenge({ focus: hasBoardFocus });
    }, AUTO_ADVANCE_DELAY_MS);
  }

  function resetRuntime() {
    runtime = createInitialState(appliedConfig, PLAYGROUND_REGION);
    roundOutcome = "ready";
    stepCount = 0;
  }

  function prepareNextChallenge({ focus = false }: { focus?: boolean } = {}) {
    clearAutoAdvanceTimer();
    try {
      challenge = createPlaygroundChallenge(appliedConfig);
      resetRuntime();
      blurBoard();
      if (focus) {
        focusBoard();
      }
    } catch {
      challenge = null;
      runtime = null;
      stepCount = 0;
      roundOutcome = "ready";
      blurBoard();
    }
  }

  function activateBoard() {
    if (isLoading) {
      return;
    }

    if (!challenge || roundOutcome === "cancel") {
      prepareNextChallenge({ focus: true });
      return;
    }

    focusBoard();
  }

  function handleBoardKeydown(event: KeyboardEvent) {
    if (isLoading || !challenge || !runtime) {
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const result = applyKey(appliedConfig, runtime, event.key);
    if (!result.didAdvance) {
      return;
    }

    stepCount += 1;
    runtime = result.state;

    if (result.clickPoint) {
      const hit = isBubbleHit(challenge, result.clickPoint);
      if (hit) {
        roundOutcome = "success";
      } else {
        roundOutcome = "miss";
      }
      scheduleNextChallenge();
      return;
    }

    if (result.state.done) {
      roundOutcome = "cancel";
      blurBoard();
    }
  }

  $effect(() => {
    if (!isActive && hasBoardFocus) {
      blurBoard();
    }
  });

  $effect(() => {
    return () => {
      clearAutoAdvanceTimer();
    };
  });

  $effect(() => {
    if (isLoading) {
      return;
    }

    appliedConfig;
    prepareNextChallenge();
  });
</script>

<SettingsCard id="playground">
  <div class="playground-shell">
    <div
      bind:this={boardElement}
      class="playground-board"
      style={boardStyle}
      role="application"
      aria-label={$t("playground.title")}
      contenteditable="true"
      spellcheck="false"
      onclick={activateBoard}
      onfocus={() => {
        hasBoardFocus = true;
      }}
      onblur={() => {
        hasBoardFocus = false;
      }}
      onkeydown={handleBoardKeydown}
    >
      {#if challenge}
        <div
          class="playground-bubble"
          data-outcome={roundOutcome}
          style={bubbleStyle(challenge, roundOutcome)}
        ></div>
      {/if}

      {#if runtime && displayGrid}
        <div
          class="playground-region"
          style={`${regionStyle(runtime.region)}${regionVisualStyle};`}
        >
          {#if showDiagonals}
            <svg
              class="playground-diagonals"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                vector-effect="non-scaling-stroke"
                stroke="var(--playground-line-color)"
                stroke-width={overlayLineWidth}
              />
              <line
                x1="100"
                y1="0"
                x2="0"
                y2="100"
                vector-effect="non-scaling-stroke"
                stroke="var(--playground-line-color)"
                stroke-width={overlayLineWidth}
              />
            </svg>
          {/if}
          <div
            class="playground-grid"
            style={`--playground-rows:${displayGrid.rows};--playground-cols:${displayGrid.cols};`}
          >
            {#each displayGrid.keys as key, index (index)}
              <div class="playground-cell">
                <span>{key}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if showOverlay}
        <div class="playground-overlay">
          <div class="playground-overlay-card" data-tone={roundOutcome}>
            <span>{boardPrompt}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</SettingsCard>

<style>
  .playground-shell {
    padding-top: 0.25rem;
  }

  .playground-board {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border: 1px solid var(--playground-line-soft, var(--settings-border-soft));
    border-radius: 0;
    box-shadow:
      inset 0 0 0 1px var(--playground-line-faint, rgba(255, 255, 255, 0.14)),
      0 12px 28px var(--settings-shadow-ambient);
    caret-color: transparent;
    color: var(--playground-text-color, var(--settings-text-primary));
    user-select: none;
    outline: none;
  }

  .playground-board:focus-visible {
    box-shadow:
      0 0 0 4px var(--settings-accent-ring),
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  }

  .playground-bubble {
    position: absolute;
    z-index: 1;
    border: 3px solid var(--playground-line-color, var(--settings-surface-strong));
    border-radius: 9999px;
    background: var(--playground-bubble-fill, rgba(251, 191, 36, 0.92));
    transform: translate(-50%, -50%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 0 0 2px var(--playground-overlay-fill, var(--settings-surface)),
      0 0 0 8px var(--playground-bubble-glow, rgba(245, 158, 11, 0.22)),
      0 18px 40px var(--settings-shadow-ambient);
    transition:
      transform 180ms ease,
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  .playground-bubble[data-outcome="success"] {
    transform: translate(-50%, -50%) scale(1.08);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 0 0 2px var(--playground-overlay-fill, var(--settings-surface)),
      0 0 0 10px var(--playground-bubble-glow, rgba(34, 197, 94, 0.24)),
      0 18px 40px var(--settings-shadow-ambient);
  }

  .playground-bubble[data-outcome="miss"] {
    transform: translate(-50%, -50%) scale(0.96);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 0 0 2px var(--playground-overlay-fill, var(--settings-surface)),
      0 0 0 10px var(--playground-bubble-glow, rgba(244, 63, 94, 0.22)),
      0 18px 40px var(--settings-shadow-ambient);
  }

  .playground-region {
    position: absolute;
    z-index: 2;
    border: 1px solid var(--playground-line-color, var(--settings-text-primary));
    border-width: var(--playground-line-width, 1px);
    border-radius: 0;
    background: transparent;
    overflow: hidden;
    transition:
      left 150ms ease,
      top 150ms ease,
      width 150ms ease,
      height 150ms ease;
  }

  .playground-grid {
    display: grid;
    grid-template-columns: repeat(var(--playground-cols), minmax(0, 1fr));
    grid-template-rows: repeat(var(--playground-rows), minmax(0, 1fr));
    width: 100%;
    height: 100%;
  }

  .playground-cell {
    display: flex;
    min-width: 0;
    min-height: 0;
    align-items: center;
    justify-content: center;
    border-right: var(--playground-line-width, 1px) solid
      var(--playground-cell-border, var(--playground-line-faint));
    border-bottom: var(--playground-line-width, 1px) solid
      var(--playground-cell-border, var(--playground-line-faint));
    padding: 0.15rem;
    text-align: center;
  }

  .playground-cell span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--playground-text-color);
    font-family: var(--playground-font-family), sans-serif;
    font-size: var(--playground-font-size, 12px);
    font-weight: 700;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.34);
  }

  .playground-diagonals {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .playground-overlay {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .playground-overlay-card {
    display: inline-flex;
    max-width: min(88%, 20rem);
    align-items: center;
    justify-content: center;
    border: 1px solid var(--playground-line-soft, rgba(255, 255, 255, 0.14));
    border-radius: 0;
    padding: 0.9rem 1.1rem;
    backdrop-filter: blur(10px);
    background: var(--playground-overlay-fill, var(--settings-surface-soft));
    color: var(--playground-text-color, var(--settings-text-primary));
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.2);
    text-align: center;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .playground-overlay-card[data-tone="success"] {
    background: rgba(22, 163, 74, 0.24);
  }

  .playground-overlay-card[data-tone="miss"] {
    background: rgba(225, 29, 72, 0.24);
  }
</style>
