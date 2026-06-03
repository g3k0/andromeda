"use client";

import { useAccount } from "wagmi";
import { isAdminAddress } from "@/lib/auth/admin";
import type { AuthorProfile } from "@/lib/authors/types";
import { AuthorPageContent } from "./AuthorPageContent";

export type AuthorPageClientProps = {
  profile: AuthorProfile;
};

export function AuthorPageClient({ profile }: AuthorPageClientProps) {
  const { address, isConnected } = useAccount();
  const isAdmin = isConnected && isAdminAddress(address);

  return (
    <AuthorPageContent
      profile={profile}
      viewerAddress={address}
      isConnected={isConnected}
      isAdmin={isAdmin}
    />
  );
}
