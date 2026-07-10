import { z } from "zod";

import { isSupportedLocale, type SupportedLocale } from "./locales";

export const LOCALE_COOKIE = "andromeda_locale";

const localeCookieSchema = z.enum([
  "en",
  "fr",
  "es",
  "it",
  "de",
  "pt",
  "zh",
  "ja",
]);

/** Parses a persisted locale cookie value, rejecting unknown input. */
export function parseLocaleCookie(
  value: string | null | undefined,
): SupportedLocale | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = localeCookieSchema.safeParse(value.trim());
  if (!parsed.success) {
    return null;
  }

  return isSupportedLocale(parsed.data) ? parsed.data : null;
}
