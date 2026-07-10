"use client";

import { useParams } from "next/navigation";

import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "./locales";

/** Reads the active locale from the `[locale]` route segment. */
export function useLocale(): SupportedLocale {
  const params = useParams();
  const localeParam = params?.locale;

  if (typeof localeParam === "string" && isSupportedLocale(localeParam)) {
    return localeParam;
  }

  return DEFAULT_LOCALE;
}
