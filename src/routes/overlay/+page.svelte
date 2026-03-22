<script lang="ts">
  import { onMount } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import { resolveLocalePreference, setLocale, t } from "$lib/i18n";
  import type {
    OverlayActivatePayload,
    OverlayActionPayload,
    NativeKeyPayload,
    ClickAction,
  } from "$lib/ipc/types";
  import {
    applyKey,
    createInitialState,
    getCurrentStep,
    normalizeKeyCode,
  } from "$lib/core";
  import type {
    AppConfig,
    CurrentStep,
    Point,
    Region,
    RuntimeState,
  } from "$lib/core";

  let config = $state<AppConfig | null>(null);
  let runtime = $state<RuntimeState | null>(null);
  let baseRegion = $state<Region | null>(null);
  let clickAction = $state<ClickAction | null>(null);
  let dragStartPoint = $state<Point | null>(null);
  let actionHintVisible = $state(false);
  let canvas: HTMLCanvasElement | null = null;
  const currentWindow = getCurrentWindow();
  let actionHintTimer: ReturnType<typeof setTimeout> | null = null;
  type NativeClickCommandResult = {
    continueOverlay?: boolean;
  };

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

  function enabledActions(config: AppConfig | null): ClickAction[] {
    if (!config) {
      return ["left"];
    }
    const disabled = new Set(config.mouse.disabledActions ?? []);
    const enabled = config.mouse.actionCycle.filter(
      (action) => !disabled.has(action),
    );
    return enabled.length > 0 ? enabled : ["left"];
  }

  function defaultAction(config: AppConfig | null): ClickAction {
    const [first] = enabledActions(config);
    return first ?? "left";
  }

  function dragPhaseLabel(startPoint: Point | null): string {
    return startPoint
      ? $t("overlay.drag.phaseEnd")
      : $t("overlay.drag.phaseStart");
  }

  function actionLabel(action: ClickAction | null): string {
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
      case "drag":
        return dragPhaseLabel(dragStartPoint);
      default:
        return actionLabel(defaultAction(config));
    }
  }

  function clearActionHintTimer() {
    if (!actionHintTimer) {
      return;
    }
    clearTimeout(actionHintTimer);
    actionHintTimer = null;
  }

  function showActionHint() {
    actionHintVisible = true;
    clearActionHintTimer();
    const timeoutMs = clickAction === "drag" ? 1400 : 1000;
    actionHintTimer = setTimeout(() => {
      actionHintVisible = false;
      actionHintTimer = null;
    }, timeoutMs);
  }

  function actionHintStyle(config: AppConfig | null): string {
    if (!config) {
      return "";
    }

    const background = withAlpha(
      config.overlay.maskColor,
      0.22,
      "rgba(0, 0, 0, 0.22)",
    );
    const border = withAlpha(
      config.overlay.lineColor,
      0.14,
      "rgba(255, 255, 255, 0.14)",
    );
    const text = withAlpha(
      config.overlay.textColor,
      0.9,
      "rgba(255, 255, 255, 0.9)",
    );

    return `background:${background};border-color:${border};color:${text};`;
  }

  function getDisplayGrid(
    config: AppConfig,
    runtime: RuntimeState,
    step: CurrentStep,
  ) {
    if (step.mode !== "combo" || step.stage !== 0) {
      return { rows: step.rows, cols: step.cols, keys: step.keys };
    }

    const layer = config.layers[runtime.layerIndex];
    if (!layer || layer.mode !== "combo") {
      return { rows: step.rows, cols: step.cols, keys: step.keys };
    }

    const rowKeys = layer.stage1.keys;
    const colKeys = layer.stage0.keys;
    if (!rowKeys.length || !colKeys.length) {
      return { rows: step.rows, cols: step.cols, keys: step.keys };
    }

    const labels: string[] = [];
    for (const rowKey of rowKeys) {
      for (const colKey of colKeys) {
        labels.push(`${colKey}${rowKey}`);
      }
    }

    return { rows: rowKeys.length, cols: colKeys.length, keys: labels };
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
      return fallback;
    }
    return Math.round(candidate);
  }

  function shouldReturnToDragStart(key: string): boolean {
    if (
      !config ||
      !runtime ||
      clickAction !== "drag" ||
      !dragStartPoint ||
      runtime.history.length > 0
    ) {
      return false;
    }

    return (
      normalizeKeyCode(key) === normalizeKeyCode(config.hotkeys.controls.undo)
    );
  }

  function draw() {
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    ctx.clearRect(0, 0, width, height);

    if (!config || !runtime || !baseRegion) {
      return;
    }

    const step = getCurrentStep(config, runtime);
    if (!step) {
      return;
    }

    const display = getDisplayGrid(config, runtime, step);
    const offsetX = -baseRegion.x / scale;
    const offsetY = -baseRegion.y / scale;
    const regionX = runtime.region.x / scale + offsetX;
    const regionY = runtime.region.y / scale + offsetY;
    const regionW = runtime.region.width / scale;
    const regionH = runtime.region.height / scale;
    const regionCenterX = regionX + regionW / 2;
    const regionCenterY = regionY + regionH / 2;

    // Mask the whole screen so grid/text read clearly
    ctx.fillStyle = `${config.overlay.maskColor}${Math.round(
      config.overlay.alpha,
    )
      .toString(16)
      .padStart(2, "0")}`;
    ctx.fillRect(0, 0, width, height);

    const showGrid = config.overlay.showGrid;
    const showDiagonals = config.overlay.showDiagonals;
    if (showGrid || showDiagonals) {
      ctx.strokeStyle = config.overlay.lineColor;
      ctx.lineWidth = Math.max(1, config.overlay.lineWidthPx);
    }

    const cellW = regionW / display.cols;
    const cellH = regionH / display.rows;

    if (showGrid) {
      ctx.strokeRect(regionX, regionY, regionW, regionH);

      for (let col = 1; col < display.cols; col += 1) {
        const x = regionX + col * cellW;
        ctx.beginPath();
        ctx.moveTo(x, regionY);
        ctx.lineTo(x, regionY + regionH);
        ctx.stroke();
      }

      for (let row = 1; row < display.rows; row += 1) {
        const y = regionY + row * cellH;
        ctx.beginPath();
        ctx.moveTo(regionX, y);
        ctx.lineTo(regionX + regionW, y);
        ctx.stroke();
      }
    }

    if (showDiagonals) {
      ctx.beginPath();
      ctx.moveTo(regionX, regionY);
      ctx.lineTo(regionX + regionW, regionY + regionH);
      ctx.moveTo(regionX + regionW, regionY);
      ctx.lineTo(regionX, regionY + regionH);
      ctx.stroke();
    }

    if (clickAction === "drag" && dragStartPoint) {
      const startX = dragStartPoint.x / scale + offsetX;
      const startY = dragStartPoint.y / scale + offsetY;

      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = Math.max(1.5, config.overlay.lineWidthPx + 0.5);
      ctx.strokeStyle = withAlpha(
        config.overlay.lineColor,
        0.72,
        "rgba(255, 255, 255, 0.72)",
      );
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(regionCenterX, regionCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = withAlpha(
        config.overlay.textColor,
        0.92,
        "rgba(255, 255, 255, 0.92)",
      );
      ctx.strokeStyle = withAlpha(
        config.overlay.maskColor,
        0.62,
        "rgba(0, 0, 0, 0.62)",
      );
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(startX, startY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(regionCenterX, regionCenterY, 5, 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(
        config.overlay.lineColor,
        0.9,
        "rgba(255, 255, 255, 0.9)",
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = config.overlay.textColor;
    const fontSizePx = resolveLayerFontSize(config, runtime);
    ctx.font = `600 ${fontSizePx}px ${config.overlay.font.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 4;

    for (let index = 0; index < display.keys.length; index += 1) {
      const row = Math.floor(index / display.cols);
      const col = index % display.cols;
      if (row >= display.rows) {
        break;
      }
      const x = regionX + (col + 0.5) * cellW;
      const y = regionY + (row + 0.5) * cellH;
      ctx.fillText(display.keys[index].toUpperCase(), x, y);
    }
  }

  async function handleKey(key: string) {
    if (!config || !runtime) {
      return;
    }

    if (shouldReturnToDragStart(key)) {
      await invoke("drag_session_back");
      return;
    }

    const result = applyKey(config, runtime, key);
    runtime = result.state;
    draw();

    if (result.clickPoint) {
      const action = clickAction ?? defaultAction(config);
      let continueOverlay = false;
      try {
        const response = await invoke<NativeClickCommandResult>(
          "native_click",
          {
            payload: {
              x: result.clickPoint.x,
              y: result.clickPoint.y,
              button: action,
            },
          },
        );
        continueOverlay = response?.continueOverlay === true;
      } catch {
        await invoke("close_overlay");
      } finally {
        if (!continueOverlay) {
          await currentWindow.hide();
        }
      }
      return;
    }

    if (result.state.done) {
      await invoke("close_overlay");
      await currentWindow.hide();
    }
  }

  onMount(() => {
    let unlistenActivate: (() => void) | undefined;
    let unlistenAction: (() => void) | undefined;
    let unlistenKey: (() => void) | undefined;

    void (async () => {
      unlistenActivate = await listen<OverlayActivatePayload>(
        "overlay:activate",
        (event) => {
          setLocale(resolveLocalePreference(event.payload.config.app.locale));
          config = event.payload.config;
          baseRegion = event.payload.region;
          dragStartPoint = event.payload.drag?.startPoint ?? null;
          runtime = createInitialState(
            event.payload.config,
            event.payload.region,
          );
          clickAction =
            event.payload.clickAction ?? defaultAction(event.payload.config);
          showActionHint();
          draw();
        },
      );

      unlistenAction = await listen<OverlayActionPayload>(
        "overlay:action",
        (event) => {
          clickAction = event.payload.clickAction;
          if (event.payload.clickAction !== "drag") {
            dragStartPoint = null;
          }
          showActionHint();
        },
      );

      unlistenKey = await listen<NativeKeyPayload>("native:key", (event) => {
        void handleKey(event.payload.key);
      });
    })();

    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);

    return () => {
      clearActionHintTimer();
      unlistenActivate?.();
      unlistenAction?.();
      unlistenKey?.();
      window.removeEventListener("resize", handleResize);
    };
  });
</script>

<main>
  {#if runtime && actionHintVisible}
    <div class="action-hint" style={actionHintStyle(config)}>
      {actionLabel(clickAction)}
    </div>
  {/if}
  <canvas bind:this={canvas}></canvas>
</main>

<style>
  :global(body) {
    margin: 0;
    background: transparent;
    overflow: hidden;
  }

  main {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  .action-hint {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    padding: 12px 18px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.22);
    color: rgba(255, 255, 255, 0.9);
    font-size: clamp(24px, 3.2vw, 34px);
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.02em;
    white-space: nowrap;
    backdrop-filter: blur(6px);
  }

  canvas {
    width: 100vw;
    height: 100vh;
    display: block;
  }
</style>
