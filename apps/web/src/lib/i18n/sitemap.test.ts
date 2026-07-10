import { describe, expect, it } from "vitest";

import { SUPPORTED_LOCALE_CODES } from "./locales";
import { STATIC_INDEXABLE_PATHS } from "./static-paths";
import { buildLocalizedSitemapEntries } from "./sitemap";

describe("buildLocalizedSitemapEntries", () => {
  it("emits one entry per locale for each static indexable path", () => {
    const entries = buildLocalizedSitemapEntries(
      "https://example.com",
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(entries).toHaveLength(
      STATIC_INDEXABLE_PATHS.length * SUPPORTED_LOCALE_CODES.length,
    );
  });

  it("includes absolute URLs and hreflang alternates", () => {
    const entries = buildLocalizedSitemapEntries("https://example.com");

    const italianWorks = entries.find(
      (entry) => entry.url === "https://example.com/it/works",
    );

    expect(italianWorks?.alternates?.languages).toMatchObject({
      en: "https://example.com/en/works",
      fr: "https://example.com/fr/works",
      it: "https://example.com/it/works",
      "x-default": "https://example.com/en/works",
    });
  });

  it("covers the home page for every locale", () => {
    const entries = buildLocalizedSitemapEntries("https://example.com");

    for (const locale of SUPPORTED_LOCALE_CODES) {
      expect(
        entries.some((entry) => entry.url === `https://example.com/${locale}`),
      ).toBe(true);
    }
  });
});
