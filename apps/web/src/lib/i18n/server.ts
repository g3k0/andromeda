import type { SupportedLocale } from "./locales";
import { createTranslateFn } from "./translate";

/** Server-side helper for translated copy in React Server Components (PR 2+). */
export function getServerTranslations(locale: SupportedLocale) {
  return {
    locale,
    t: createTranslateFn(locale),
  };
}
