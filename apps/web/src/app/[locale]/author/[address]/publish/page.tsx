import type { Metadata } from "next";
import Link from "next/link";
import { AuthorPageInvalidAddress, AuthorPageNotFound } from "@/components/author/AuthorPageStatusMessage";
import { WorkPublishClient } from "@/components/author/WorkPublishClient";
import { resolveAuthorPageFromDatabase } from "@/lib/authors/author-page-server";

type AuthorPublishPageProps = {
  params: Promise<{ address: string }>;
};

export async function generateMetadata({
  params,
}: AuthorPublishPageProps): Promise<Metadata> {
  const { address } = await params;
  const state = await resolveAuthorPageFromDatabase(address);

  if (state.status === "ready") {
    return {
      title: `Publish work | ${state.profile.displayName} | Andromeda`,
      description: `Publish an encrypted work as ${state.profile.displayName} on Andromeda.`,
    };
  }

  return {
    title: "Publish work | Andromeda",
    description: "Publish an encrypted literary work on Andromeda.",
  };
}

export default async function AuthorPublishPage({ params }: AuthorPublishPageProps) {
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
      <Link
        href={`/author/${state.profile.address}`}
        className="text-sm text-andromeda-light hover:underline"
      >
        ← Back to author page
      </Link>
      <WorkPublishClient
        authorAddress={state.profile.address}
        authorDisplayName={state.profile.displayName}
      />
    </div>
  );
}
