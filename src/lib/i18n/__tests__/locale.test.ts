import { describe, expect, it } from "vitest";
import { resolveLocalePreference, resolveSystemLocale } from "$lib/i18n";

describe("locale resolution", () => {
  it("maps Chinese system locales to zh-CN", () => {
    expect(resolveSystemLocale("zh-CN")).toBe("zh-CN");
    expect(resolveSystemLocale("zh_TW")).toBe("zh-CN");
  });

  it("falls back to en-US for unsupported locales", () => {
    expect(resolveSystemLocale("fr-FR")).toBe("en-US");
    expect(resolveSystemLocale(null)).toBe("en-US");
  });

  it("resolves system preference against the system locale", () => {
    expect(resolveLocalePreference("system", "zh-SG")).toBe("zh-CN");
    expect(resolveLocalePreference("system", "ja-JP")).toBe("en-US");
  });

  it("preserves explicit locale preferences", () => {
    expect(resolveLocalePreference("zh-CN", "en-US")).toBe("zh-CN");
    expect(resolveLocalePreference("en-US", "zh-CN")).toBe("en-US");
  });
});
