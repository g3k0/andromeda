import type { AuthorPageResolved } from "@/lib/authors/author-page";
import { AuthorPageClient } from "./AuthorPageClient";
import { AuthorPageInvalidAddress, AuthorPageNotFound } from "./AuthorPageStatusMessage";

export type AuthorPublicPageProps = {
  state: AuthorPageResolved;
};

export function AuthorPublicPage({ state }: AuthorPublicPageProps) {
  if (state.status === "invalid_address") {
    return <AuthorPageInvalidAddress />;
  }

  if (state.status === "not_found") {
    return <AuthorPageNotFound address={state.address} />;
  }

  return <AuthorPageClient profile={state.profile} />;
}
