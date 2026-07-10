import { useI18n } from "./I18nProvider";

/** Returns the active locale from the nearest `I18nProvider`. */
export function useLocale(): ReturnType<typeof useI18n>["locale"] {
  return useI18n().locale;
}
