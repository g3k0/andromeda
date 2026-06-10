import type { Metadata } from "next";
import { AuthorPageClient } from "@/components/author/AuthorPageClient";
import {
  AuthorPageInvalidAddress,
  AuthorPageNotFound,
} from "@/components/author/AuthorPageStatusMessage";
import { resolveAuthorPageFromDatabase } from "@/lib/authors/author-page-server";

type AuthorAddressPageProps = {
  params: Promise<{ address: string }>;
};

export async function generateMetadata({
  params,
}: AuthorAddressPageProps): Promise<Metadata> {
  const { address } = await params;
  const state = await resolveAuthorPageFromDatabase(address);

  if (state.status === "ready") {
    return {
      title: `${state.profile.displayName} | Andromeda`,
      description: `Author page for ${state.profile.displayName} on Andromeda.`,
    };
  }

  return {
    title: "Author page | Andromeda",
    description: "Author profile on Andromeda.",
  };
}

export default async function AuthorAddressPage({
  params,
}: AuthorAddressPageProps) {
  const { address } = await params;
  const state = await resolveAuthorPageFromDatabase(address);

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
      <AuthorPageClient profile={state.profile} />
    </div>
  );
}
