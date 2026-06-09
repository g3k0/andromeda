"use client";

import { useAccount } from "wagmi";
import type { AuthorProfile } from "@/lib/authors/types";
import { isUserRole } from "@/lib/users/types";
import { useUserSnapshot } from "@/lib/users/use-user-snapshot";
import { AuthorPageContent } from "./AuthorPageContent";

export type AuthorPageClientProps = {
  profile: AuthorProfile;
};

export function AuthorPageClient({ profile }: AuthorPageClientProps) {
  const { address, isConnected } = useAccount();
  const { snapshot } = useUserSnapshot();

  return (
    <AuthorPageContent
      profile={profile}
      viewerAddress={address}
      isConnected={isConnected}
      isAdmin={snapshot?.permissions.includes("admin:access") ?? false}
      viewerRole={
        snapshot && isUserRole(snapshot.roleSlug) ? snapshot.roleSlug : null
      }
    />
  );
}
