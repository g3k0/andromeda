import { detectLocaleFromHeader } from "./detect-locale";
import { parseLocaleCookie } from "./cookie";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "./locales";
import { localizedPath, normalizeLogicalPath } from "./routing";

export type LocaleRequestResolution =
  | { action: "continue"; locale: SupportedLocale }
  | { action: "redirect"; locale: SupportedLocale; pathname: string };

function firstPathSegment(pathname: string): string | null {
  const segments = normalizeLogicalPath(pathname).split("/").filter(Boolean);
  return segments[0] ?? null;
}

function isUnsupportedLocaleSegment(segment: string): boolean {
  return /^[a-z]{2}$/i.test(segment) && !isSupportedLocale(segment);
}

function resolvePreferredLocale(input: {
  cookieValue?: string | null;
  acceptLanguage?: string | null;
}): SupportedLocale {
  return (
    parseLocaleCookie(input.cookieValue) ??
    detectLocaleFromHeader(input.acceptLanguage) ??
    DEFAULT_LOCALE
  );
}

/**
 * Pure locale routing decision for middleware: continue when the path already
 * has a supported locale prefix, otherwise redirect to a localized URL.
 */
export function resolveLocaleRequest(input: {
  pathname: string;
  cookieValue?: string | null;
  acceptLanguage?: string | null;
}): LocaleRequestResolution {
  const segment = firstPathSegment(input.pathname);

  if (segment && isSupportedLocale(segment)) {
    return { action: "continue", locale: segment };
  }

  if (segment && isUnsupportedLocaleSegment(segment)) {
    const logicalPath = normalizeLogicalPath(
      `/${input.pathname.split("/").slice(2).join("/")}`,
    );
    return {
      action: "redirect",
      locale: DEFAULT_LOCALE,
      pathname: localizedPath(DEFAULT_LOCALE, logicalPath),
    };
  }

  const locale = resolvePreferredLocale(input);
  return {
    action: "redirect",
    locale,
    pathname: localizedPath(locale, input.pathname),
  };
}
