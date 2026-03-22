import type { AppConfig, MouseAction, Point, Region } from "$lib/core";

export type ClickAction = MouseAction;

export interface OverlayDragPayload {
  startPoint: Point;
}

export interface OverlayActivatePayload {
  region: Region;
  config: AppConfig;
  clickAction: ClickAction;
  drag?: OverlayDragPayload | null;
}

export interface NativeKeyPayload {
  key: string;
}

export interface OverlayActionPayload {
  clickAction: ClickAction;
}

export interface NativeClickPayload {
  x: number;
  y: number;
  button: ClickAction;
}
