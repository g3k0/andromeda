import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE } from "./locales";
import {
  buildAlternateLanguages,
  buildPageAlternates,
  resolveSiteBaseUrl,
} from "./seo";

describe("resolveSiteBaseUrl", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.VERCEL_URL = originalVercelUrl;
  });

  it("prefers NEXT_PUBLIC_SITE_URL when configured", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    delete process.env.VERCEL_URL;

    expect(resolveSiteBaseUrl()).toBe("https://example.com");
  });

  it("falls back to VERCEL_URL", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "preview.vercel.app";

    expect(resolveSiteBaseUrl()).toBe("https://preview.vercel.app");
  });
});

describe("buildAlternateLanguages", () => {
  it("returns hreflang paths for every supported locale", () => {
    expect(buildAlternateLanguages("/works")).toEqual({
      en: "/en/works",
      fr: "/fr/works",
      es: "/es/works",
      it: "/it/works",
      de: "/de/works",
      pt: "/pt/works",
      "zh-Hans": "/zh/works",
      ja: "/ja/works",
      ru: "/ru/works",
      "x-default": `/${DEFAULT_LOCALE}/works`,
    });
  });
});

describe("buildPageAlternates", () => {
  it("returns canonical and language alternates for a locale", () => {
    expect(buildPageAlternates("fr", "/about")).toEqual({
      canonical: "/fr/about",
      languages: buildAlternateLanguages("/about"),
    });
  });
});
