import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALE_CODES,
  SUPPORTED_LOCALES,
  getLocaleDefinition,
  isSupportedLocale,
} from "./locales";

describe("locales registry", () => {
  it("lists nine supported locales with unique codes", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(9);
    expect(new Set(SUPPORTED_LOCALE_CODES).size).toBe(9);
    expect(SUPPORTED_LOCALE_CODES).toContain("en");
    expect(SUPPORTED_LOCALE_CODES).toContain("ja");
    expect(SUPPORTED_LOCALE_CODES).toContain("ru");
  });

  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("validates supported locale codes", () => {
    expect(isSupportedLocale("it")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("xx")).toBe(false);
    expect(isSupportedLocale("EN")).toBe(false);
  });

  it("returns metadata for a locale", () => {
    expect(getLocaleDefinition("zh")).toMatchObject({
      code: "zh",
      label: "中文",
      hreflang: "zh-Hans",
    });
  });
});
