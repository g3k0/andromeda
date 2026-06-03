"use client";

import {
  resolveAuthorPage,
  type AuthorPageResolved,
  type AuthorProfileLookup,
} from "@/lib/authors/author-page";
import { AuthorPageClient } from "./AuthorPageClient";
import { AuthorPageInvalidAddress, AuthorPageNotFound } from "./AuthorPageStatusMessage";

export type AuthorPublicPageProps = {
  addressParam: string;
  lookup?: AuthorProfileLookup;
  resolvePage?: (
    addressParam: string,
    lookup?: AuthorProfileLookup,
  ) => AuthorPageResolved;
};

export function AuthorPublicPage({
  addressParam,
  lookup,
  resolvePage = resolveAuthorPage,
}: AuthorPublicPageProps) {
  const state = lookup
    ? resolvePage(addressParam, lookup)
    : resolvePage(addressParam);

  if (state.status === "invalid_address") {
    return <AuthorPageInvalidAddress />;
  }

  if (state.status === "not_found") {
    return <AuthorPageNotFound address={state.address} />;
  }

  return <AuthorPageClient profile={state.profile} />;
}
