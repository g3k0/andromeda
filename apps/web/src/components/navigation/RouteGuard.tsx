"use client";

import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import {
  canAccessPage,
  getRouteById,
  userFromSnapshot,
} from "@/lib/navigation/route-guard";
import { useUserSnapshot } from "@/lib/users/use-user-snapshot";
import { WalletButton } from "@/components/WalletButton";

export type RouteGuardProps = {
  routeId: string;
  children: ReactNode;
};

function resolveAllowed(
  route: ReturnType<typeof getRouteById>,
  snapshot: ReturnType<typeof useUserSnapshot>["snapshot"],
  isConnected: boolean,
): boolean | null {
  if (!route) {
    return false;
  }

  if (isConnected && snapshot === null) {
    return null;
  }

  const user = snapshot ? userFromSnapshot(snapshot) : null;
  return canAccessPage(user, route, isConnected);
}

export function RouteGuard({ routeId, children }: RouteGuardProps) {
  const route = getRouteById(routeId);
  const { isConnected, isReconnecting } = useAccount();
  const { snapshot } = useUserSnapshot();
  const allowed = resolveAllowed(route, snapshot, isConnected);

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
