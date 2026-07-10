"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type { SupportedLocale } from "./locales";
import { createTranslateFn, type TranslateFn } from "./translate";

export type I18nContextValue = {
  locale: SupportedLocale;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export type I18nProviderProps = {
  locale: SupportedLocale;
  children: ReactNode;
};

/** Supplies locale and `t()` to client components. Wired from `[locale]` layout in PR 2. */
export function I18nProvider({ locale, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: createTranslateFn(locale),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
