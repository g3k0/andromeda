/** BCP 47 language tag used in hreflang metadata. */
export type HreflangTag = string;

export type SupportedLocale =
  | "en"
  | "fr"
  | "es"
  | "it"
  | "de"
  | "pt"
  | "zh"
  | "ja";

export type LocaleDefinition = {
  code: SupportedLocale;
  /** Native language name shown in the header dropdown. */
  label: string;
  /** Flag emoji for the dropdown menu. */
  flag: string;
  hreflang: HreflangTag;
};

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const SUPPORTED_LOCALES: readonly LocaleDefinition[] = [
  { code: "en", label: "English", flag: "🇬🇧", hreflang: "en" },
  { code: "fr", label: "Français", flag: "🇫🇷", hreflang: "fr" },
  { code: "es", label: "Español", flag: "🇪🇸", hreflang: "es" },
  { code: "it", label: "Italiano", flag: "🇮🇹", hreflang: "it" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", hreflang: "de" },
  { code: "pt", label: "Português", flag: "🇵🇹", hreflang: "pt" },
  { code: "zh", label: "中文", flag: "🇨🇳", hreflang: "zh-Hans" },
  { code: "ja", label: "日本語", flag: "🇯🇵", hreflang: "ja" },
] as const;

export const SUPPORTED_LOCALE_CODES: readonly SupportedLocale[] =
  SUPPORTED_LOCALES.map((locale) => locale.code);

const LOCALE_SET = new Set<string>(SUPPORTED_LOCALE_CODES);

/** Type guard for locale segment validation in routing and middleware. */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return LOCALE_SET.has(value);
}

export function getLocaleDefinition(
  locale: SupportedLocale,
): LocaleDefinition {
  const definition = SUPPORTED_LOCALES.find((entry) => entry.code === locale);
  if (!definition) {
    throw new Error(`Unknown locale: ${locale}`);
  }
  return definition;
}
