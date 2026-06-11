"use server";

import { cookies } from "next/headers";
import { establishWalletSession } from "@/lib/auth/establish-wallet-session";
import { refreshWalletSessionFromDb } from "@/lib/auth/refresh-wallet-session";
import { getAuth, requireAuth } from "@/lib/auth/require-auth";
import { assertCanAccessAdmin } from "@/lib/users/authorize";
import { walletAuthSchema } from "@/lib/authors/schemas";
import {
  WALLET_SESSION_COOKIE_NAME,
  buildClearWalletSessionCookieOptions,
  buildWalletSessionCookieOptions,
} from "@/lib/auth/wallet-session-cookies";
import { getWalletSessionService } from "@/lib/auth/wallet-session-server";
import type { WalletSessionStatus } from "@/lib/auth/wallet-session";

export async function establishWalletSessionAction(
  input: unknown,
): Promise<WalletSessionStatus> {
  const auth = walletAuthSchema.parse(input);
  const [session, cookieStore] = await Promise.all([
    establishWalletSession(auth),
    cookies(),
  ]);

  cookieStore.set(
    WALLET_SESSION_COOKIE_NAME,
    session.sessionId,
    buildWalletSessionCookieOptions(session.expiresAt),
  );

  return {
    active: true,
    expiresAt: session.expiresAt.toISOString(),
  };
}

export async function getWalletSessionStatusAction(): Promise<WalletSessionStatus> {
  await getAuth().catch(() => null);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value;
  const sessionService = await getWalletSessionService();
  return sessionService.getStatus(sessionId);
}

export async function isAdminWalletSessionReadyAction(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await refreshWalletSessionFromDb(sessionId);
  }

  try {
    const user = await requireAuth();
    assertCanAccessAdmin(user);
    return true;
  } catch {
    return false;
  }
}

export async function revokeWalletSessionAction(): Promise<void> {
  await getAuth().catch(() => null);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    const sessionService = await getWalletSessionService();
    await sessionService.revoke(sessionId);
  }

  cookieStore.set(
    WALLET_SESSION_COOKIE_NAME,
    "",
    buildClearWalletSessionCookieOptions(),
  );
}
