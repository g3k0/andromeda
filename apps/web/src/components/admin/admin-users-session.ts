import type { SignMessageFn } from "@/lib/auth/client-wallet-auth";
import type { WalletSessionStatus } from "@/lib/auth/wallet-session";

export type EnsureAdminSessionDeps = {
  getStatus: () => Promise<WalletSessionStatus>;
  sign: (address: string, signMessage: SignMessageFn) => Promise<{
    address: string;
    message: string;
    signature: `0x${string}`;
  }>;
  establish: (payload: {
    address: string;
    message: string;
    signature: `0x${string}`;
  }) => Promise<WalletSessionStatus>;
};

export async function ensureAdminSession(
  address: string,
  signMessageAsync: SignMessageFn,
  deps: EnsureAdminSessionDeps,
): Promise<void> {
  const status = await deps.getStatus();
  if (status.active) {
    return;
  }

  const signed = await deps.sign(address, signMessageAsync);
  await deps.establish(signed);
}

export function adminSessionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("expired")) {
    return "Your admin session expired. Please confirm again in your wallet.";
  }
  return "Failed to authorize admin access. Confirm in your wallet to continue.";
}
