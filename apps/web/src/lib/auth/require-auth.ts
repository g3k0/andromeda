import "server-only";

import { cookies, headers } from "next/headers";
import { resolveAuthorizedSnapshotWallet } from "@/lib/auth/resolve-snapshot-wallet";
import { resolveWalletAuth } from "@/lib/auth/resolve-wallet-auth";
import { verifyWalletSignature } from "@/lib/auth/verify-wallet";
import type { WalletAuthInput } from "@/lib/authors/schemas";
import { WALLET_SESSION_COOKIE_NAME } from "@/lib/auth/wallet-session-cookies";
import { getUserService } from "@/lib/users/server";
import type { AuthenticatedUser } from "@/lib/users/types";

export type WalletSignaturePayload = {
  address: string;
  message: string;
  signature: `0x${string}`;
};

async function getSessionIdFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value;
}

export async function getAuth(
  walletAuth?: WalletAuthInput | null,
): Promise<AuthenticatedUser> {
  const sessionId = await getSessionIdFromCookies();
  const [signer, service] = await Promise.all([
    resolveWalletAuth({ sessionId, walletAuth: walletAuth ?? null }),
    getUserService(),
  ]);
  service.assertActive(signer);
  return signer;
}

export async function requireAuth(
  walletAuth?: WalletAuthInput | null,
): Promise<AuthenticatedUser> {
  return getAuth(walletAuth);
}

export async function verifyAuth(
  input: WalletSignaturePayload,
): Promise<string> {
  return verifyWalletSignature(input);
}

export async function checkAuth(
  address: string | undefined,
  isConnected: boolean,
): Promise<void> {
  if (!isConnected || !address) {
    return;
  }

  const headerList = await headers();
  const authorizedAddress = await resolveAuthorizedSnapshotWallet(
    address,
    headerList.get("cookie"),
  );

  if (!authorizedAddress) {
    throw new Error("Unauthorized");
  }
}
