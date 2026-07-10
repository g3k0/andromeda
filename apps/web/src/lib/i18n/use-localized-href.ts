"use client";

import { useCallback } from "react";

import { localizedPath } from "./routing";
import { useLocale } from "./use-locale";

/** Returns a function that prefixes logical paths with the active locale. */
export function useLocalizedHref() {
  const locale = useLocale();

  return useCallback((path: string) => localizedPath(locale, path), [locale]);
}
