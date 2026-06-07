"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
import {
  canAccessPage,
  getRouteById,
  userFromSnapshot,
} from "@/lib/navigation/route-guard";
import { WalletButton } from "@/components/WalletButton";

export type RouteGuardProps = {
  routeId: string;
  children: ReactNode;
};

export function RouteGuard({ routeId, children }: RouteGuardProps) {
  const route = getRouteById(routeId);
  const { address, isConnected } = useAccount();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!route) {
      setAllowed(false);
      return;
    }

    let cancelled = false;

    void getUserSnapshotAction(address, isConnected).then((snapshot) => {
      if (cancelled) {
        return;
      }

      const user = snapshot ? userFromSnapshot(snapshot) : null;
      setAllowed(canAccessPage(user, route, isConnected));
    });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, route]);

  if (!route) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-semibold">Route not found</h1>
      </div>
    );
  }

  if (!isConnected && route.pagePermission !== "pages:read") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-xl font-semibold">{route.label}</h1>
        <p className="mt-2 text-sm text-white/60">
          Connect your wallet to continue.
        </p>
        <div className="mt-4 flex justify-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  if (allowed === null) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm text-white/60">Checking access…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-white/60">
          You are not authorized to access {route.label}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
