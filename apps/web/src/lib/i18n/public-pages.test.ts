import { describe, expect, it } from "vitest";

import { SUPPORTED_LOCALE_CODES } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";

const HOME_KEYS = [
  "home.tagline",
  "home.headline",
  "home.intro",
  "home.cardCertifiedTitle",
] as const;

const ABOUT_KEYS = [
  "about.title",
  "about.intro",
  "about.whatWeDoTitle",
  "about.donationsTitle",
  "about.openTitle",
] as const;

const FLOW_KEYS = [
  "work.metaTitle",
  "mint.buyCopy",
  "reader.decryptRead",
] as const;

describe("public page i18n keys", () => {
  it.each(SUPPORTED_LOCALE_CODES)("resolves home keys for locale %s", (locale) => {
    for (const key of HOME_KEYS) {
      const label = translate(locale, key);
      expect(label).not.toMatch(/^\[missing:/);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it.each(SUPPORTED_LOCALE_CODES)("resolves about keys for locale %s", (locale) => {
    for (const key of ABOUT_KEYS) {
      const label = translate(locale, key);
      expect(label).not.toMatch(/^\[missing:/);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it.each(SUPPORTED_LOCALE_CODES)(
    "resolves work mint and reader keys for locale %s",
    (locale) => {
      for (const key of FLOW_KEYS) {
        const label = translate(locale, key);
        expect(label).not.toMatch(/^\[missing:/);
        expect(label.length).toBeGreaterThan(0);
      }
    },
  );
});
