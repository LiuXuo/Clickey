import { describe, expect, it } from "vitest";
import { applyKey, createInitialState } from "$lib/core";
import type { Point } from "$lib/core";
import { getDefaultConfig } from "$lib/shared/default-config";
import {
  PLAYGROUND_REGION,
  createPlaygroundChallenge,
  isBubbleHit,
} from "../playground";

describe("settings playground challenge", () => {
  it("creates a fully solvable bubble target from the current config", () => {
    const config = getDefaultConfig();
    const challenge = createPlaygroundChallenge(config, () => 0);

    let state = createInitialState(config, PLAYGROUND_REGION);
    let clickPoint: Point | undefined;

    for (const key of challenge.keys) {
      const result = applyKey(config, state, key);
      state = result.state;
      clickPoint = result.clickPoint ?? clickPoint;
    }

    expect(state.done).toBe(true);
    expect(clickPoint).toEqual(challenge.clickPoint);
    expect(state.region).toEqual(challenge.finalRegion);
    expect(isBubbleHit(challenge, challenge.clickPoint)).toBe(true);
  });

  it("keeps the rendered bubble radius within the supported range", () => {
    const config = getDefaultConfig();
    const challenge = createPlaygroundChallenge(config, () => 0.999999);

    expect(challenge.bubbleRadiusPx).toBeGreaterThanOrEqual(16);
    expect(challenge.bubbleRadiusPx).toBeLessThanOrEqual(42);
  });
});
