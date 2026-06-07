"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
import { getUserRole } from "@/lib/auth/roles";
import { buildHeaderNavLinks } from "@/lib/navigation/header-nav";
import type { UserSnapshot } from "@/lib/users/types";

export function SiteHeaderNav() {
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

  const role = getUserRole({
    address,
    isConnected,
    hasAuthorProfile: snapshot?.hasAuthorProfile ?? false,
    isAdmin: snapshot?.role === "admin",
    userRole: snapshot?.role,
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
