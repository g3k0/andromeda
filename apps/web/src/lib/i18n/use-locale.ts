"use client";

import { useParams } from "next/navigation";

import { useOptionalI18n } from "./I18nProvider";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "./locales";

/** Reads the active locale from I18nProvider or the `[locale]` route segment. */
export function useLocale(): SupportedLocale {
  const i18n = useOptionalI18n();
  const params = useParams();
  const localeParam = params?.locale;

  if (i18n) {
    return i18n.locale;
  }

  if (typeof localeParam === "string" && isSupportedLocale(localeParam)) {
    return localeParam;
  }

  return DEFAULT_LOCALE;
}
