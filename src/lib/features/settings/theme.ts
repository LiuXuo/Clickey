import type { SettingsThemePreference } from "$lib/core";

export type ResolvedSettingsTheme = "light" | "dark";

export function isSettingsThemePreference(
  value: string,
): value is SettingsThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveSettingsTheme(
  preference: SettingsThemePreference,
  systemPrefersDark: boolean,
): ResolvedSettingsTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}
