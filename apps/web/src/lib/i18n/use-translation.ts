"use client";

import { useMemo } from "react";

import { createTranslateFn } from "./translate";
import { useLocale } from "./use-locale";

/** Returns the active locale and bound `t()` function for client components. */
export function useTranslation() {
  const locale = useLocale();
  const t = useMemo(() => createTranslateFn(locale), [locale]);

  return { locale, t };
}
