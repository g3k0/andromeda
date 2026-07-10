import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "./locales";
import { localizedPath } from "./routing";

/** Resolves the public site origin used for metadata alternates. */
export function resolveSiteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel}`;
  }

  return "http://localhost:3000";
}

/** Builds hreflang → localized path entries for a logical page path. */
export function buildAlternateLanguages(
  logicalPath: string,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    languages[locale.hreflang] = localizedPath(locale.code, logicalPath);
  }

  languages["x-default"] = localizedPath(DEFAULT_LOCALE, logicalPath);
  return languages;
}

/** Returns canonical and hreflang alternates for a localized page. */
export function buildPageAlternates(
  locale: SupportedLocale,
  logicalPath: string,
) {
  return {
    canonical: localizedPath(locale, logicalPath),
    languages: buildAlternateLanguages(logicalPath),
  };
}
