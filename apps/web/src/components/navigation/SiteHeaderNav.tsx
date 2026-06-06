"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { isAdminAddress } from "@/lib/auth/admin";
import { getUserRole } from "@/lib/auth/roles";
import { buildAuthorOnboardingSnapshot } from "@/lib/authors/onboarding";
import { buildHeaderNavLinks } from "@/lib/navigation/header-nav";

export function SiteHeaderNav() {
  const { address, isConnected } = useAccount();
  const snapshot = buildAuthorOnboardingSnapshot(address, isConnected);
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
