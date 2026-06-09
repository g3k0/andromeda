"use client";

import { useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  clearWalletBindingClient,
  ensureWalletBound,
} from "@/lib/auth/wallet-binding-client";

export function useWalletBinding() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    if (!address || !isConnected) {
      clearWalletBindingClient();
      return;
    }

    void ensureWalletBound(address, signMessageAsync).catch(() => {
      clearWalletBindingClient();
    });
  }, [address, isConnected, signMessageAsync]);
}
