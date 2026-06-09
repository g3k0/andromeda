import "server-only";

import { normalizeAddress } from "@/lib/authors/address";
import { getWalletSessionService } from "./wallet-session-server";
import {
  parseCookieHeader,
  WALLET_BINDING_COOKIE_NAME,
} from "./wallet-binding-cookie";
import { WALLET_SESSION_COOKIE_NAME } from "./wallet-session-cookies";

export async function resolveAuthorizedSnapshotWallet(
  requestedAddress: string | null | undefined,
  cookieHeader: string | null | undefined,
): Promise<string | null> {
  const normalized = requestedAddress
    ? normalizeAddress(requestedAddress)
    : null;
  if (!normalized) {
    return null;
  }

  const sessionId = parseCookieHeader(cookieHeader, WALLET_SESSION_COOKIE_NAME);
  if (sessionId) {
    const sessionService = await getWalletSessionService();
    const snapshot = await sessionService.resolve(sessionId);
    if (snapshot?.address === normalized) {
      return normalized;
    }
  }

  const boundWallet = parseCookieHeader(
    cookieHeader,
    WALLET_BINDING_COOKIE_NAME,
  );
  if (boundWallet === normalized) {
    return normalized;
  }

  return null;
}
