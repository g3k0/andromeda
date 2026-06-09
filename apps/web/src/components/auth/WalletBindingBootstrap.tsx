"use client";

import { useWalletBinding } from "@/lib/auth/use-wallet-binding";

export function WalletBindingBootstrap() {
  useWalletBinding();
  return null;
}
