import { describe, expect, it } from "vitest";

import {
  detectBrowserLocale,
  detectLocaleFromHeader,
  detectLocaleFromTags,
  normalizeLanguageTag,
} from "./detect-locale";

describe("normalizeLanguageTag", () => {
  it("maps primary subtags to supported locales", () => {
    expect(normalizeLanguageTag("en-US")).toBe("en");
    expect(normalizeLanguageTag("fr-FR")).toBe("fr");
    expect(normalizeLanguageTag("it")).toBe("it");
  });

  it("normalizes regional aliases", () => {
    expect(normalizeLanguageTag("pt-BR")).toBe("pt");
    expect(normalizeLanguageTag("pt-PT")).toBe("pt");
    expect(normalizeLanguageTag("zh-CN")).toBe("zh");
    expect(normalizeLanguageTag("zh-Hans")).toBe("zh");
  });

  it("returns null for unsupported languages", () => {
    expect(normalizeLanguageTag("ko-KR")).toBeNull();
    expect(normalizeLanguageTag("")).toBeNull();
    expect(normalizeLanguageTag("   ")).toBeNull();
  });
});

describe("detectLocaleFromTags", () => {
  it("picks the first supported tag", () => {
    expect(detectLocaleFromTags(["ko-KR", "es-ES", "en"])).toBe("es");
  });

  it("falls back to English when nothing matches", () => {
    expect(detectLocaleFromTags(["ko", "ar"])).toBe("en");
    expect(detectLocaleFromTags([])).toBe("en");
  });
});

describe("detectLocaleFromHeader", () => {
  it("parses Accept-Language in priority order", () => {
    expect(detectLocaleFromHeader("de-DE,en;q=0.8,it;q=0.6")).toBe("de");
    expect(detectLocaleFromHeader("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
  });

  it("defaults to English for missing or unsupported headers", () => {
    expect(detectLocaleFromHeader(null)).toBe("en");
    expect(detectLocaleFromHeader("ko-KR")).toBe("en");
    expect(detectLocaleFromHeader("   ")).toBe("en");
  });
});

describe("detectBrowserLocale", () => {
  it("uses navigator language lists when provided", () => {
    expect(detectBrowserLocale(["ja-JP", "en-US"])).toBe("ja");
  });

  it("defaults to English when no languages are provided", () => {
    expect(detectBrowserLocale(undefined)).toBe("en");
    expect(detectBrowserLocale([])).toBe("en");
  });
});
