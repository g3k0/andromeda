import type { Metadata } from "next";

import { DonationSection } from "@/components/about/DonationSection";
import { buildLocalizedPageMetadata } from "@/lib/i18n/page-metadata";
import { getServerTranslations } from "@/lib/i18n/server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isSupportedLocale(localeParam)) {
    return {};
  }

  return buildLocalizedPageMetadata(
    localeParam as SupportedLocale,
    "/about",
    "meta.about.title",
    "meta.about.description",
  );
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam)
    ? (localeParam as SupportedLocale)
    : ("en" as const);
  const { t } = getServerTranslations(locale);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t("about.title")}</h1>
        <p className="max-w-2xl text-lg text-white/70">{t("about.intro")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t("about.whatWeDoTitle")}</h2>
        <p className="max-w-2xl text-white/70">{t("about.whatWeDoBody")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t("about.noFeesTitle")}</h2>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-white/70">
          <li>{t("about.noFeesItem1")}</li>
          <li>{t("about.noFeesItem2")}</li>
          <li>
            <strong className="text-white/90">{t("about.noFeesItem3Strong")}</strong>{" "}
            {t("about.noFeesItem3Rest")}
          </li>
          <li>{t("about.noFeesItem4")}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t("about.authorsPayTitle")}</h2>
        <p className="max-w-2xl text-white/70">
          {t("about.authorsPayIntroBefore")}{" "}
          <strong className="text-white/90">{t("about.authorsPayIntroStrong")}</strong>{" "}
          {t("about.authorsPayIntroAfter")}
        </p>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-white/70">
          <li>
            <strong className="text-white/90">{t("about.authorsPayGasStrong")}</strong>{" "}
            {t("about.authorsPayGasRest")}
          </li>
          <li>
            <strong className="text-white/90">{t("about.authorsPayIpfsStrong")}</strong>{" "}
            {t("about.authorsPayIpfsRest")}
          </li>
          <li>
            <strong className="text-white/90">{t("about.authorsPayBuyerStrong")}</strong>{" "}
            {t("about.authorsPayBuyerRest")}
          </li>
        </ul>
        <p className="max-w-2xl text-sm text-white/50">{t("about.authorsPayFootnote")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t("about.moneyGoesTitle")}</h2>
        <div className="max-w-2xl space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          <div>
            <p className="font-medium text-white">{t("about.moneyGoesPrimaryTitle")}</p>
            <p className="mt-2">
              {t("about.moneyGoesPrimaryBodyBefore")}{" "}
              <strong className="text-white/90">
                {t("about.moneyGoesPrimaryBodyStrong")}
              </strong>
              {t("about.moneyGoesPrimaryBodyAfter")}
            </p>
          </div>
          <div>
            <p className="font-medium text-white">{t("about.moneyGoesSecondaryTitle")}</p>
            <p className="mt-2">{t("about.moneyGoesSecondaryBody")}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t("about.authorControlTitle")}</h2>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-white/70">
          <li>
            <strong className="text-white/90">{t("about.authorControlEditionStrong")}</strong>{" "}
            {t("about.authorControlEditionRest")}
          </li>
          <li>
            <strong className="text-white/90">{t("about.authorControlCertStrong")}</strong>{" "}
            {t("about.authorControlCertRest")}
          </li>
          <li>
            <strong className="text-white/90">{t("about.authorControlSaleStrong")}</strong>{" "}
            {t("about.authorControlSaleRest")}
          </li>
          <li>
            <strong className="text-white/90">{t("about.authorControlPriceStrong")}</strong>{" "}
            {t("about.authorControlPriceRest")}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t("about.readersTitle")}</h2>
        <p className="max-w-2xl text-white/70">
          {t("about.readersPara1Before")}{" "}
          <strong className="text-white/90">{t("about.readersPara1Strong")}</strong>
          . {t("about.readersPara1After")}
        </p>
        <p className="max-w-2xl text-white/70">
          {t("about.readersPara2Before")}{" "}
          <strong className="text-white/90">{t("about.readersPara2StrongWallet")}</strong>.{" "}
          {t("about.readersPara2Middle")}{" "}
          <strong className="text-white/90">{t("about.readersPara2StrongFree")}</strong>
        </p>
        <p className="max-w-2xl text-white/70">
          {t("about.readersPara3Before")}{" "}
          <strong className="text-white/90">{t("about.readersPara3Strong")}</strong>{" "}
          {t("about.readersPara3After")}
        </p>
      </section>

      <DonationSection locale={locale} />

      <section className="space-y-3 border-t border-white/10 pt-8">
        <h2 className="text-2xl font-semibold">{t("about.openTitle")}</h2>
        <p className="max-w-2xl text-white/70">{t("about.openBody")}</p>
      </section>
    </div>
  );
}
