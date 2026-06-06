"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getAuthorOnboardingSnapshotAction } from "@/app/actions/onboarding";
import { isAdminAddress } from "@/lib/auth/admin";
import { getUserRole } from "@/lib/auth/roles";
import type { AuthorOnboardingSnapshot } from "@/lib/authors/onboarding";
import { buildHeaderNavLinks } from "@/lib/navigation/header-nav";

export function SiteHeaderNav() {
  const { address, isConnected } = useAccount();
  const [snapshot, setSnapshot] = useState<AuthorOnboardingSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getAuthorOnboardingSnapshotAction(address, isConnected).then((next) => {
      if (!cancelled) {
        setSnapshot(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const isAdmin = isAdminAddress(address);
  const role = getUserRole({
    address,
    isConnected,
    hasAuthorProfile: snapshot?.hasAuthorProfile ?? false,
    isAdmin,
  });

  const links = buildHeaderNavLinks({
    role,
    hasAuthorProfile: snapshot?.hasAuthorProfile ?? false,
  });

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-white/70 hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
