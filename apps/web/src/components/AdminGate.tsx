"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
import { WalletButton } from "./WalletButton";

export function AdminGate({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getUserSnapshotAction(address, isConnected).then((snapshot) => {
      if (!cancelled) {
        setCanAccess(snapshot?.role === "admin");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-xl font-semibold">Admin area</h1>
        <p className="mt-2 text-sm text-white/60">
          Connect an authorized wallet to continue.
        </p>
        <div className="mt-4 flex justify-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  if (canAccess === null) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm text-white/60">Checking admin access…</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-white/60">
          The connected wallet is not authorized for the admin area.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
