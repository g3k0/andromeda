"use client";

import { useMemo } from "react";

import { useOptionalI18n } from "./I18nProvider";
import { createTranslateFn } from "./translate";
import { useLocale } from "./use-locale";

/** Returns the active locale and bound `t()` function for client components. */
export function useTranslation() {
  const i18n = useOptionalI18n();
  const locale = useLocale();
  const t = useMemo(
    () => i18n?.t ?? createTranslateFn(locale),
    [i18n, locale],
  );

  return { locale, t };
}
