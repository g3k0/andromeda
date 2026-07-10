import type { Metadata } from "next";

import { LibraryClient } from "@/components/works/LibraryClient";
import { buildLocalizedPageMetadata } from "@/lib/i18n/page-metadata";
import { getServerTranslations } from "@/lib/i18n/server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";

type LibraryPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LibraryPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isSupportedLocale(localeParam)) {
    return {};
  }

  return buildLocalizedPageMetadata(
    localeParam as SupportedLocale,
    "/library",
    "meta.library.title",
    "meta.library.description",
  );
}

export default async function LibraryPage({
  params,
}: LibraryPageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam)
    ? (localeParam as SupportedLocale)
    : ("en" as const);
  const { t } = getServerTranslations(locale);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("library.title")}</h1>
        <p className="text-sm text-white/60">{t("library.subtitle")}</p>
      </header>

      <LibraryClient />
    </div>
  );
}
