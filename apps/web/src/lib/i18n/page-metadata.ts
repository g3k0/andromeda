import type { Metadata } from "next";

import { getServerTranslations } from "./server";
import { buildPageAlternates } from "./seo";
import type { SupportedLocale } from "./locales";

/** Builds localized page metadata with canonical and hreflang alternates. */
export function buildLocalizedPageMetadata(
  locale: SupportedLocale,
  logicalPath: string,
  titleKey: string,
  descriptionKey: string,
): Metadata {
  const { t } = getServerTranslations(locale);

  return {
    title: t(titleKey),
    description: t(descriptionKey),
    alternates: buildPageAlternates(locale, logicalPath),
  };
}
