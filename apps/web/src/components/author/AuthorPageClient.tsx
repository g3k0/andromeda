"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
import type { AuthorProfile } from "@/lib/authors/types";
import { isUserRole, type UserSnapshot } from "@/lib/users/types";
import { AuthorPageContent } from "./AuthorPageContent";

export type AuthorPageClientProps = {
  profile: AuthorProfile;
};

export function AuthorPageClient({ profile }: AuthorPageClientProps) {
  const { address, isConnected } = useAccount();
  const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getUserSnapshotAction(address, isConnected).then((next) => {
      if (!cancelled) {
        setSnapshot(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

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
