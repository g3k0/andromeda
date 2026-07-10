import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "./locales";

/** Ensures a logical path starts with `/` and has no trailing slash (except `/`). */
export function normalizeLogicalPath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  return withLeading.replace(/\/+$/, "") || "/";
}

/**
 * Removes a leading locale segment from a pathname.
 * `/it/works/3` → `/works/3`; `/works` → `/works`.
 */
export function stripLocalePrefix(pathname: string): string {
  const normalized = normalizeLogicalPath(pathname);
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  if (isSupportedLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return normalized;
}

/**
 * Prefixes a logical path with the locale segment.
 * `localizedPath("it", "/works")` → `/it/works`.
 */
export function localizedPath(
  locale: SupportedLocale,
  path: string,
): string {
  const logical = stripLocalePrefix(path);
  if (logical === "/") {
    return `/${locale}`;
  }
  return `/${locale}${logical}`;
}

/**
 * Replaces (or adds) the locale segment while preserving the rest of the path.
 * `/it/works/3` + `de` → `/de/works/3`.
 */
export function switchLocaleInPath(
  pathname: string,
  newLocale: SupportedLocale,
): string {
  const logical = stripLocalePrefix(pathname);
  return localizedPath(newLocale, logical);
}

/** Reads the locale prefix from a pathname, if present and supported. */
export function getLocaleFromPathname(
  pathname: string,
): SupportedLocale | null {
  const segments = normalizeLogicalPath(pathname).split("/").filter(Boolean);
  const candidate = segments[0];
  return candidate && isSupportedLocale(candidate) ? candidate : null;
}

/** Returns the locale prefix or English when the path has no locale segment. */
export function resolveLocaleFromPathname(pathname: string): SupportedLocale {
  return getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE;
}
