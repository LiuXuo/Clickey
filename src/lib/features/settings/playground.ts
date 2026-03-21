import { applyKey, createInitialState, getCurrentStep } from "$lib/core";
import type { AppConfig, Point, Region } from "$lib/core";

export interface PlaygroundChallenge {
  keys: string[];
  clickPoint: Point;
  finalRegion: Region;
  bubbleRadiusPx: number;
}

export const PLAYGROUND_REGION: Region = {
  x: 0,
  y: 0,
  // Keep the virtual playground geometry aligned with the rendered 16:9 board.
  width: 1600,
  height: 900,
};

const MIN_BUBBLE_RADIUS_PX = 16;
const MAX_BUBBLE_RADIUS_PX = 42;
const BUBBLE_RADIUS_RATIO = 0.32;

function pickRandomIndex(length: number, random: () => number): number {
  if (length <= 1) {
    return 0;
  }

  const candidate = Math.floor(random() * length);
  return Math.min(length - 1, Math.max(0, candidate));
}

function resolveBubbleRadius(finalRegion: Region): number {
  const candidate = Math.round(
    Math.min(finalRegion.width, finalRegion.height) * BUBBLE_RADIUS_RATIO,
  );
  return Math.min(
    MAX_BUBBLE_RADIUS_PX,
    Math.max(MIN_BUBBLE_RADIUS_PX, candidate),
  );
}

export function createPlaygroundChallenge(
  config: AppConfig,
  random: () => number = Math.random,
  region: Region = PLAYGROUND_REGION,
): PlaygroundChallenge {
  let state = createInitialState(config, region);
  const keys: string[] = [];
  let clickPoint: Point | undefined;

  while (!state.done) {
    const step = getCurrentStep(config, state);
    if (!step || step.keys.length === 0) {
      throw new Error("Unable to build a playground challenge from config.");
    }

    const key = step.keys[pickRandomIndex(step.keys.length, random)];
    keys.push(key);

    const result = applyKey(config, state, key);
    state = result.state;

    if (result.clickPoint) {
      clickPoint = result.clickPoint;
    }
  }

  if (!clickPoint || keys.length === 0) {
    throw new Error("Unable to resolve a playable bubble target.");
  }

  return {
    keys,
    clickPoint,
    finalRegion: { ...state.region },
    bubbleRadiusPx: resolveBubbleRadius(state.region),
  };
}

export function distanceBetweenPoints(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isBubbleHit(
  challenge: PlaygroundChallenge,
  point: Point,
): boolean {
  return (
    distanceBetweenPoints(challenge.clickPoint, point) <=
    challenge.bubbleRadiusPx
  );
}
