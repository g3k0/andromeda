import { useI18n } from "./I18nProvider";

/** Returns the active locale and bound `t()` function for client components. */
export function useTranslation() {
  const { locale, t } = useI18n();
  return { locale, t };
}
