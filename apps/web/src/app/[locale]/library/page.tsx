import type { Metadata } from "next";

import { LibraryClient } from "@/components/works/LibraryClient";
import { buildLocalizedPageMetadata } from "@/lib/i18n/page-metadata";
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

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Your library</h1>
        <p className="text-sm text-white/60">
          Every copy you own, ready to read in your browser.
        </p>
      </header>

      <LibraryClient />
    </div>
  );
}
