import en from "@/locales/en.json";

import { DEFAULT_LOCALE, type SupportedLocale } from "./locales";
import type { MessageTree } from "./types";

const catalogs: Partial<Record<SupportedLocale, MessageTree>> = {
  en: en as MessageTree,
};

/** Returns the message catalog for a locale, falling back to English. */
export function getMessageCatalog(locale: SupportedLocale): MessageTree {
  return catalogs[locale] ?? catalogs[DEFAULT_LOCALE]!;
}

/** Resolves a dot-separated key against a nested message tree. */
export function getMessageByPath(
  catalog: MessageTree,
  key: string,
): string | undefined {
  const parts = key.split(".");
  let current: string | MessageTree | undefined = catalog;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

/** Registers a locale catalog (used when additional JSON files are added). */
export function registerMessageCatalog(
  locale: SupportedLocale,
  catalog: MessageTree,
): void {
  catalogs[locale] = catalog;
}

/** Clears non-default catalogs — for tests only. */
export function resetMessageCatalogsForTests(): void {
  for (const locale of Object.keys(catalogs) as SupportedLocale[]) {
    if (locale !== DEFAULT_LOCALE) {
      delete catalogs[locale];
    }
  }
}
