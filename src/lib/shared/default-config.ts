import type { AppConfig } from "$lib/core";
import rawDefaultConfig from "$lib/shared/default-config.json";
import { isMacPlatform } from "$lib/shared/platform";

export function getDefaultConfig(): AppConfig {
  const config = JSON.parse(JSON.stringify(rawDefaultConfig)) as AppConfig;

  if (isMacPlatform()) {
    config.hotkeys.activation.trigger = "Cmd+;";
  }

  return config;
}
