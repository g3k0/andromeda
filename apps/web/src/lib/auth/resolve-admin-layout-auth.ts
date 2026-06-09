import "server-only";

import { assertCanAccessAdmin } from "@/lib/users/authorize";
import { getUserService } from "@/lib/users/server";
import type { AuthenticatedUser } from "@/lib/users/types";
import { WalletAuthorizationError } from "./errors";
import { resolveWalletAuth } from "./resolve-wallet-auth";
import {
  parseCookieHeader,
  WALLET_BINDING_COOKIE_NAME,
} from "./wallet-binding-cookie";
import { WALLET_SESSION_COOKIE_NAME } from "./wallet-session-cookies";

export async function resolveAdminLayoutAuth(
  cookieHeader: string | null | undefined,
): Promise<AuthenticatedUser> {
  const sessionId = parseCookieHeader(cookieHeader, WALLET_SESSION_COOKIE_NAME);

  if (sessionId) {
    try {
      const user = await resolveWalletAuth({
        sessionId,
        walletAuth: null,
        cookieHeader,
      });
      assertCanAccessAdmin(user);
      return user;
    } catch {
      // Fall back to wallet binding when the session is missing or stale.
    }
  }

  const boundWallet = parseCookieHeader(
    cookieHeader,
    WALLET_BINDING_COOKIE_NAME,
  );
  if (!boundWallet) {
    throw new WalletAuthorizationError();
  }

  const userService = await getUserService();
  const user = await userService.getAuthenticatedByAddress(boundWallet);
  if (!user) {
    throw new WalletAuthorizationError();
  }

  userService.assertActive(user);
  assertCanAccessAdmin(user);
  return user;
}
