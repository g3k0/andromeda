import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AuthorIndexPage } from "@/components/author/AuthorIndexPage";
import { resolveAuthorIndexServerRedirect } from "@/lib/authors/author-index-server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Author page",
  description:
    "Open or create your Andromeda author page to publish and sell author-certified literary works.",
};

type AuthorIndexRouteProps = {
  params: Promise<{ locale: string }>;
};

export default async function AuthorIndexRoute({
  params,
}: AuthorIndexRouteProps) {
  const { locale: localeParam } = await params;
  if (!isSupportedLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as SupportedLocale;
  const redirectPath = await resolveAuthorIndexServerRedirect();
  if (redirectPath) {
    redirect(localizedPath(locale, redirectPath));
  }

  return <AuthorIndexPage />;
}
