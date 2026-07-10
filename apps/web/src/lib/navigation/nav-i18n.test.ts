import { describe, expect, it } from "vitest";

import { SUPPORTED_LOCALE_CODES } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";

const NAV_KEYS = [
  "nav.catalog",
  "nav.library",
  "nav.about",
  "nav.admin",
  "nav.myPage",
] as const;

const ROLE_MENU_KEYS = [
  "roleMenu.profileSettings",
  "roleMenu.becomeAuthor",
  "roleMenu.manageUsers",
  "roleMenu.logout",
  "roleMenu.loggingOut",
] as const;

const COMMON_KEYS = [
  "common.processing",
  "common.loading",
  "common.loadingAria",
] as const;

describe("navigation i18n keys", () => {
  it.each(SUPPORTED_LOCALE_CODES)(
    "resolves nav labels for locale %s",
    (locale) => {
      for (const key of NAV_KEYS) {
        const label = translate(locale, key);
        expect(label).not.toMatch(/^\[missing:/);
        expect(label.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SUPPORTED_LOCALE_CODES)(
    "resolves role menu labels for locale %s",
    (locale) => {
      for (const key of ROLE_MENU_KEYS) {
        const label = translate(locale, key);
        expect(label).not.toMatch(/^\[missing:/);
        expect(label.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(SUPPORTED_LOCALE_CODES)(
    "resolves common shell labels for locale %s",
    (locale) => {
      for (const key of COMMON_KEYS) {
        const label = translate(locale, key);
        expect(label).not.toMatch(/^\[missing:/);
        expect(label.length).toBeGreaterThan(0);
      }
    },
  );
});
