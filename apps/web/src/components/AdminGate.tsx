"use client";

import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { isAdminAddress } from "@/lib/auth/admin";
import { WalletButton } from "./WalletButton";

export function AdminGate({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();

  const isAdmin = isConnected && isAdminAddress(address);

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

  if (!isAdmin) {
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
