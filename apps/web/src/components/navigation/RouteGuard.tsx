"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
import { whenWalletBound } from "@/lib/auth/wallet-binding-client";
import {
  canAccessPage,
  getRouteById,
  userFromSnapshot,
} from "@/lib/navigation/route-guard";
import { USER_SNAPSHOT_REFRESH_EVENT } from "@/lib/users/user-snapshot-sync";
import { WalletButton } from "@/components/WalletButton";

export type RouteGuardProps = {
  routeId: string;
  children: ReactNode;
};

export function RouteGuard({ routeId, children }: RouteGuardProps) {
  const route = getRouteById(routeId);
  const { address, isConnected, isReconnecting } = useAccount();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!route) {
      setAllowed(false);
      return;
    }

    let cancelled = false;

    async function evaluateAccess() {
      if (isConnected && address) {
        await whenWalletBound(address);
      }

      const snapshot = await getUserSnapshotAction(address, isConnected);
      if (cancelled) {
        return;
      }

      const user = snapshot ? userFromSnapshot(snapshot) : null;
      setAllowed(canAccessPage(user, route, isConnected));
    }

    void evaluateAccess();

    function handleSnapshotRefresh() {
      void evaluateAccess();
    }

    window.addEventListener(USER_SNAPSHOT_REFRESH_EVENT, handleSnapshotRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(
        USER_SNAPSHOT_REFRESH_EVENT,
        handleSnapshotRefresh,
      );
    };
  }, [address, isConnected, route]);

  if (!route) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-semibold">Route not found</h1>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm text-white/60">Reconnecting wallet…</p>
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
