import type { Metadata } from "next";

import { buildLocalizedPageMetadata } from "@/lib/i18n/page-metadata";
import { getServerTranslations } from "@/lib/i18n/server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isSupportedLocale(localeParam)) {
    return {};
  }

  return buildLocalizedPageMetadata(
    localeParam as SupportedLocale,
    "/",
    "meta.home.title",
    "meta.home.description",
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam)
    ? (localeParam as SupportedLocale)
    : ("en" as const);
  const { t } = getServerTranslations(locale);

  const cards = [
    {
      title: t("home.cardCertifiedTitle"),
      body: t("home.cardCertifiedBody"),
    },
    {
      title: t("home.cardOwnedTitle"),
      body: t("home.cardOwnedBody"),
    },
    {
      title: t("home.cardDirectTitle"),
      body: t("home.cardDirectBody"),
    },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-lg font-medium tracking-wide text-andromeda-light">
          {t("home.tagline")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">{t("home.headline")}</h1>
        <p className="max-w-2xl text-lg text-white/70">{t("home.intro")}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="font-semibold text-andromeda-light">{card.title}</h2>
            <p className="mt-2 text-sm text-white/60">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-white/10 pt-8">
        <blockquote className="max-w-2xl space-y-3">
          <p className="text-lg italic text-white/80">{t("home.quote")}</p>
          <footer className="text-sm not-italic text-white/50">
            {t("home.quoteAttribution")}
          </footer>
        </blockquote>
      </section>
    </div>
  );
}
