import { describe, expect, it } from "vitest";
import type { AppConfig, Region, RuntimeState } from "../types";
import { applyKey, createInitialState } from "../engine";

function makeConfig(): AppConfig {
  return {
    app: {
      locale: "zh-CN",
      launchOnLogin: { enabled: false },
      settingsWindow: { openOnLaunch: true, theme: "system" },
    },
    hotkeys: {
      activation: {
        trigger: "Ctrl+;",
      },
      controls: {
        cancel: "Esc",
        undo: "Backspace",
        directClick: "Space",
        switchAction: "Enter",
        nextMonitor: "Tab",
        nudgeLeft: "ArrowLeft",
        nudgeRight: "ArrowRight",
        nudgeUp: "ArrowUp",
        nudgeDown: "ArrowDown",
      },
    },
    nudge: {
      stepPx: 5,
    },
    mouse: {
      actionCycle: [
        "left",
        "right",
        "middle",
        "moveOnly",
        "doubleLeft",
        "ctrlLeft",
        "cmdLeft",
        "shiftLeft",
      ],
      disabledActions: ["doubleLeft", "ctrlLeft", "cmdLeft", "shiftLeft"],
      smoothMove: true,
      moveDurationMs: 120,
      moveStepMs: 8,
      pressDurationMs: 24,
      landingRadiusPx: 1,
      durationRandomness: 0.24,
      stepRandomness: 0.22,
      distanceBoostPx: 1800,
      durationDistanceBoost: 0.28,
      stepDistanceBoost: 0.42,
      curveAlongRatio: 0.08,
      curveSpreadRatio: 0.12,
      jitterRatio: 0.01,
      adaptiveStrideBasePx: 7,
      adaptiveStrideDistanceRatio: 0.026,
      adaptiveStrideMaxPx: 42,
      extraStepsMax: 6,
      maxSteps: 220,
      maxStepSleepMs: 24,
    },
    layers: [
      {
        mode: "combo",
        stage0: { rows: 1, cols: 2, keys: ["a", "b"] },
        stage1: { rows: 2, cols: 1, keys: ["c", "d"] },
      },
      {
        mode: "single",
        rows: 1,
        cols: 2,
        keys: ["e", "f"],
      },
    ],
    overlay: {
      alpha: 120,
      maskColor: "#000000",
      lineColor: "#ffffff",
      textColor: "#ffffff",
      lineWidthPx: 1,
      showGrid: true,
      showDiagonals: true,
      font: { family: "Segoe UI", sizePx: 12, layerSizePx: [16, 12] },
    },
  };
}

describe("engine inputs", () => {
  it("cancels on Escape", () => {
    const config = makeConfig();
    const state = createInitialState(config, {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    const result = applyKey(config, state, "Escape");

    expect(result.state.done).toBe(true);
    expect(result.clickPoint).toBeUndefined();
  });

  it("direct-clicks on Space", () => {
    const config = makeConfig();
    const state = createInitialState(config, {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    const result = applyKey(config, state, "Space");

    expect(result.state.done).toBe(true);
    expect(result.clickPoint).toEqual({ x: 50, y: 50 });
  });

  it("undoes the last step", () => {
    const config = makeConfig();
    const region: Region = { x: 0, y: 0, width: 100, height: 100 };
    const initial = createInitialState(config, region);

    const advanced = applyKey(config, initial, "a");
    expect(advanced.state.stage).toBe(1);
    expect(advanced.state.history).toHaveLength(1);

    const undone = applyKey(config, advanced.state, "Backspace");
    expect(undone.state.stage).toBe(0);
    expect(undone.state.layerIndex).toBe(0);
    expect(undone.state.region).toEqual(region);
    expect(undone.state.history).toHaveLength(0);
  });

  it("nudges region in combo stage 0, combo stage 1, and single", () => {
    const config = makeConfig();
    const initial = createInitialState(config, {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    const comboStage0State: RuntimeState = {
      ...initial,
      layerIndex: 0,
      stage: 0,
      region: { x: 10, y: 10, width: 20, height: 20 },
    };

    const comboStage0Nudged = applyKey(config, comboStage0State, "Right");
    expect(comboStage0Nudged.state.region).toEqual({
      x: 15,
      y: 10,
      width: 20,
      height: 20,
    });

    const comboStage1State: RuntimeState = {
      ...initial,
      layerIndex: 0,
      stage: 1,
      region: { x: 10, y: 10, width: 20, height: 20 },
    };

    const comboStage1Nudged = applyKey(config, comboStage1State, "Down");
    expect(comboStage1Nudged.state.region).toEqual({
      x: 10,
      y: 15,
      width: 20,
      height: 20,
    });

    const singleState: RuntimeState = {
      ...initial,
      layerIndex: 1,
      stage: 0,
      region: { x: 10, y: 10, width: 20, height: 20 },
    };

    const nudged = applyKey(config, singleState, "Right");
    expect(nudged.state.region).toEqual({
      x: 15,
      y: 10,
      width: 20,
      height: 20,
    });

    const movedOutsideBase = applyKey(
      config,
      { ...singleState, region: { x: 0, y: 0, width: 20, height: 20 } },
      "Left",
    );
    expect(movedOutsideBase.state.region.x).toBe(-5);
  });

  it("uses configured nudge step size", () => {
    const config = makeConfig();
    config.nudge.stepPx = 12;
    const initial = createInitialState(config, {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    const singleState: RuntimeState = {
      ...initial,
      layerIndex: 1,
      stage: 0,
      region: { x: 10, y: 10, width: 20, height: 20 },
    };

    const nudged = applyKey(config, singleState, "Right");
    expect(nudged.state.region).toEqual({
      x: 22,
      y: 10,
      width: 20,
      height: 20,
    });
  });

  it("uses configured nudge hotkeys", () => {
    const config = makeConfig();
    config.hotkeys.controls.nudgeRight = "l";
    config.hotkeys.controls.nudgeLeft = "h";
    const initial = createInitialState(config, {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    const state: RuntimeState = {
      ...initial,
      layerIndex: 0,
      stage: 1,
      region: { x: 10, y: 10, width: 20, height: 20 },
    };

    const nudgedRight = applyKey(config, state, "l");
    expect(nudgedRight.state.region.x).toBe(15);

    const nudgedLeft = applyKey(config, state, "h");
    expect(nudgedLeft.state.region.x).toBe(5);
  });
});
