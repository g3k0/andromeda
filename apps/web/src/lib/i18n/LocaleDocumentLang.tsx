"use client";

import { useEffect } from "react";

import type { SupportedLocale } from "./locales";

/** Keeps document.documentElement.lang in sync with the active locale segment. */
export function LocaleDocumentLang({ locale }: { locale: SupportedLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
