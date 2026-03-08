import { browser } from "$app/environment";
import { derived, get, writable } from "svelte/store";
import zh from "./locales/zh-CN";
import en from "./locales/en-US";

export type Locale = "zh-CN" | "en-US";

const STORAGE_KEY = "clickey.locale";
export const DEFAULT_LOCALE: Locale = "zh-CN";

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

export const locale = writable<Locale>(DEFAULT_LOCALE);

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
  if (stored === "zh-CN" || stored === "en-US") {
    locale.set(stored);
  }
  document.documentElement.lang = get(locale);
};

export const setLocale = (next: Locale) => {
  locale.set(next);
  if (!browser) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, next);
  document.documentElement.lang = next;
};
