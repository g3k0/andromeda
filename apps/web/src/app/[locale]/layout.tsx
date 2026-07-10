import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { LocaleDocumentLang } from "@/lib/i18n/LocaleDocumentLang";
import {
  SUPPORTED_LOCALE_CODES,
  isSupportedLocale,
  type SupportedLocale,
} from "@/lib/i18n/locales";

import { Providers } from "../providers";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALE_CODES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;
  if (!isSupportedLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as SupportedLocale;

  return (
    <>
      <LocaleDocumentLang locale={locale} />
      <Providers>
        <I18nProvider locale={locale}>
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </I18nProvider>
      </Providers>
    </>
  );
}
