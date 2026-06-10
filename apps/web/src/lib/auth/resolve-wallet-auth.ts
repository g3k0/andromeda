import "server-only";

import { verifyWalletSignature, type WalletSignatureInput } from "./verify-wallet";
import { WalletAuthorizationError } from "./errors";
import { getWalletSessionService } from "./wallet-session-server";
import { getUserService } from "@/lib/users/server";
import { UserNotFoundError, UserSuspendedError } from "@/lib/users/errors";
import type { AuthenticatedUser } from "@/lib/users/types";
import {
  parseCookieHeader,
  WALLET_SESSION_COOKIE_NAME,
} from "./wallet-session-cookies";
import { authenticatedUserFromSessionSnapshot } from "./session-authenticated-user";

export type ResolveWalletAuthInput = {
  sessionId?: string | null;
  walletAuth?: WalletSignatureInput | null;
  cookieHeader?: string | null;
};

export async function resolveWalletAuth(
  input: ResolveWalletAuthInput,
): Promise<AuthenticatedUser> {
  const sessionId =
    input.sessionId ??
    parseCookieHeader(input.cookieHeader, WALLET_SESSION_COOKIE_NAME) ??
    null;
  const [sessionService, userService] = await Promise.all([
    getWalletSessionService(),
    getUserService(),
  ]);

  if (sessionId) {
    const snapshot = await sessionService.resolve(sessionId);
    if (snapshot) {
      const user = authenticatedUserFromSessionSnapshot(snapshot);

      try {
        userService.assertActive(user);
        return user;
      } catch (error) {
        if (error instanceof UserSuspendedError) {
          await sessionService.revoke(sessionId);
        }
        throw error;
      }
    }
  }

  if (input.walletAuth) {
    const address = await verifyWalletSignature(input.walletAuth);
    const user = await userService.getAuthenticatedByAddress(address);
    if (!user) {
      throw new UserNotFoundError(address);
    }
    userService.assertActive(user);
    return user;
  }

  throw new WalletAuthorizationError();
}
