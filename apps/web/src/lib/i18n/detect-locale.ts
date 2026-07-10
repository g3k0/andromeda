import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "./locales";

/**
 * Maps regional language tags to the supported locale codes used in URL paths.
 * Example: `pt-BR` → `pt`, `zh-CN` → `zh`.
 */
const REGIONAL_LOCALE_ALIASES: Record<string, SupportedLocale> = {
  pt: "pt",
  zh: "zh",
};

/**
 * Normalizes an IETF language tag to a supported locale code, or `null` when
 * unsupported. Primary subtag is checked first (`en-US` → `en`), then aliases.
 */
export function normalizeLanguageTag(tag: string): SupportedLocale | null {
  const trimmed = tag.trim();
  if (!trimmed) {
    return null;
  }

  const primary = trimmed.split("-")[0]?.toLowerCase();
  if (!primary) {
    return null;
  }

  if (isSupportedLocale(primary)) {
    return primary;
  }

  const lowerTag = trimmed.toLowerCase();
  if (lowerTag.startsWith("zh")) {
    return "zh";
  }

  return REGIONAL_LOCALE_ALIASES[primary] ?? null;
}

/**
 * Picks the first supported locale from an ordered list of language tags.
 * Returns `DEFAULT_LOCALE` when nothing matches.
 */
export function detectLocaleFromTags(
  tags: readonly string[],
): SupportedLocale {
  for (const tag of tags) {
    const locale = normalizeLanguageTag(tag);
    if (locale) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}

/**
 * Parses an HTTP `Accept-Language` header (server/middleware) into the best
 * supported locale. Quality values are ignored; tag order is respected.
 */
export function detectLocaleFromHeader(
  acceptLanguage: string | null | undefined,
): SupportedLocale {
  if (!acceptLanguage?.trim()) {
    return DEFAULT_LOCALE;
  }

  const tags = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim() ?? "")
    .filter(Boolean);

  return detectLocaleFromTags(tags);
}

/**
 * Detects locale from browser `navigator.languages` / `navigator.language`.
 * Intended for client-side hints only; middleware remains authoritative.
 */
export function detectBrowserLocale(
  navigatorLanguages?: readonly string[],
): SupportedLocale {
  if (navigatorLanguages && navigatorLanguages.length > 0) {
    return detectLocaleFromTags(navigatorLanguages);
  }
  return DEFAULT_LOCALE;
}
