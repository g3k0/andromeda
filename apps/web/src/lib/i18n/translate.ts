import { interpolate } from "./interpolate";
import { getMessageByPath, getMessageCatalog } from "./messages";
import { DEFAULT_LOCALE, type SupportedLocale } from "./locales";
import type { TranslationParams } from "./types";

function missingKeyLabel(key: string): string {
  if (process.env.NODE_ENV === "production") {
    return key;
  }
  return `[missing:${key}]`;
}

/**
 * Translates a dot-separated key for the given locale with optional
 * `{placeholder}` interpolation. Falls back to English when a key is absent.
 */
export function translate(
  locale: SupportedLocale,
  key: string,
  params?: TranslationParams,
): string {
  let message = getMessageByPath(getMessageCatalog(locale), key);

  if (message === undefined && locale !== DEFAULT_LOCALE) {
    message = getMessageByPath(getMessageCatalog(DEFAULT_LOCALE), key);
  }

  if (message === undefined) {
    return missingKeyLabel(key);
  }

  return interpolate(message, params);
}

export type TranslateFn = (
  key: string,
  params?: TranslationParams,
) => string;

/** Binds `translate` to a fixed locale — used by hooks and server helpers. */
export function createTranslateFn(locale: SupportedLocale): TranslateFn {
  return (key, params) => translate(locale, key, params);
}
