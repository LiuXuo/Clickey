import { browser } from "$app/environment";
import type {
  LocalePreference as LocalePreferenceValue,
  ResolvedLocale,
} from "$lib/core";
import { derived, get, writable } from "svelte/store";
import zh from "./locales/zh-CN";
import en from "./locales/en-US";

export type Locale = ResolvedLocale;
export type LocalePreference = LocalePreferenceValue;

const STORAGE_KEY = "clickey.locale";
export const DEFAULT_LOCALE_PREFERENCE: LocalePreference = "system";
export const DEFAULT_LOCALE: Locale = "en-US";

export type TranslationKey = keyof typeof zh;
export type TranslationParams = Record<string, string | number>;
export type TranslateFn = (
  key: TranslationKey,
  params?: TranslationParams,
) => string;

const translations: Record<Locale, Record<TranslationKey, string>> = {
  "zh-CN": zh,
  "en-US": en,
};

const formatter = (template: string, params?: TranslationParams) => {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null) {
      return match;
    }
    return String(value);
  });
};

export function isLocalePreference(value: string): value is LocalePreference {
  return value === "system" || value === "zh-CN" || value === "en-US";
}

function isChineseLocaleTag(value: string): boolean {
  const normalized = value.trim().replace(/_/g, "-").toLowerCase();
  return normalized === "zh" || normalized.startsWith("zh-");
}

export function resolveSystemLocale(
  candidates?: readonly string[] | string | null,
): Locale {
  const localeCandidates = Array.isArray(candidates)
    ? candidates
    : typeof candidates === "string"
      ? [candidates]
      : browser
        ? [navigator.language, ...(navigator.languages ?? [])]
        : [];

  return localeCandidates.some(
    (candidate) =>
      typeof candidate === "string" && isChineseLocaleTag(candidate),
  )
    ? "zh-CN"
    : DEFAULT_LOCALE;
}

export function resolveLocalePreference(
  preference: LocalePreference,
  systemLocales?: readonly string[] | string | null,
): Locale {
  if (preference === "system") {
    return resolveSystemLocale(systemLocales);
  }
  return preference;
}

export const locale = writable<Locale>(resolveSystemLocale());

export const t = derived(locale, ($locale) => {
  return ((key: TranslationKey, params?: TranslationParams) => {
    const template =
      translations[$locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
    return formatter(template, params);
  }) satisfies TranslateFn;
});

export const initLocale = () => {
  if (!browser) {
    return;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  const preference =
    stored !== null && isLocalePreference(stored)
      ? stored
      : DEFAULT_LOCALE_PREFERENCE;
  locale.set(resolveLocalePreference(preference));
  document.documentElement.lang = get(locale);
};

export const setLocale = (next: Locale) => {
  locale.set(next);
  if (browser) {
    document.documentElement.lang = next;
  }
};

export const setLocalePreference = (next: LocalePreference) => {
  setLocale(resolveLocalePreference(next));
  if (browser) {
    localStorage.setItem(STORAGE_KEY, next);
  }
};
