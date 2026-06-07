"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
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

  const links = buildHeaderNavLinks({
    role: snapshot?.role ?? "reader",
    hasAuthorProfile: snapshot?.hasAuthorProfile ?? false,
    isConnected,
    snapshot,
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
