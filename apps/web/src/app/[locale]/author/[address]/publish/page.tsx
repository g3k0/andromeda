import type { Metadata } from "next";
import { AuthorPageInvalidAddress, AuthorPageNotFound } from "@/components/author/AuthorPageStatusMessage";
import { WorkPublishClient } from "@/components/author/WorkPublishClient";
import { resolveAuthorPageFromDatabase } from "@/lib/authors/author-page-server";
import { LocalizedLink } from "@/lib/i18n/LocalizedLink";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { getServerTranslations } from "@/lib/i18n/server";

type AuthorPublishPageProps = {
  params: Promise<{ locale: string; address: string }>;
};

export async function generateMetadata({
  params,
}: AuthorPublishPageProps): Promise<Metadata> {
  const { locale: localeParam, address } = await params;
  const state = await resolveAuthorPageFromDatabase(address);

  if (!isSupportedLocale(localeParam)) {
    return {};
  }

  const { t } = getServerTranslations(localeParam as SupportedLocale);

  if (state.status === "ready") {
    return {
      title: t("publish.meta.titleWithAuthor", {
        name: state.profile.displayName,
      }),
      description: t("publish.meta.descriptionWithAuthor", {
        name: state.profile.displayName,
      }),
    };
  }

  return {
    title: t("publish.meta.title"),
    description: t("publish.meta.description"),
  };
}

export default async function AuthorPublishPage({ params }: AuthorPublishPageProps) {
  const { locale: localeParam, address } = await params;
  const state = await resolveAuthorPageFromDatabase(address);
  const locale = isSupportedLocale(localeParam)
    ? (localeParam as SupportedLocale)
    : "en";
  const { t } = getServerTranslations(locale);

  if (state.status === "invalid_address") {
    return (
      <div className="space-y-6">
        <AuthorPageInvalidAddress />
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="space-y-6">
        <AuthorPageNotFound address={state.address} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LocalizedLink
        href={`/author/${state.profile.address}`}
        className="text-sm text-andromeda-light hover:underline"
      >
        {t("publish.backToAuthor")}
      </LocalizedLink>
      <WorkPublishClient
        authorAddress={state.profile.address}
        authorDisplayName={state.profile.displayName}
      />
    </div>
  );
}
