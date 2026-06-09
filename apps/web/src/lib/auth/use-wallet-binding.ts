"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { bindWalletAction } from "@/app/actions/bind-wallet";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";

export function useWalletBinding() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const bindingAddressRef = useRef<string | null>(null);

  const bindWallet = useCallback(async () => {
    if (!address || !isConnected) {
      bindingAddressRef.current = null;
      return;
    }

    if (bindingAddressRef.current === address.toLowerCase()) {
      return;
    }

    const signed = await createSignedWalletPayload(address, signMessageAsync);
    await bindWalletAction(signed);
    bindingAddressRef.current = address.toLowerCase();
  }, [address, isConnected, signMessageAsync]);

  useEffect(() => {
    if (!address || !isConnected) {
      bindingAddressRef.current = null;
      return;
    }

    void bindWallet().catch(() => {
      bindingAddressRef.current = null;
    });
  }, [address, bindWallet, isConnected]);

  return { bindWallet };
}
