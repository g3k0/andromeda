import "server-only";

import { getUserService } from "@/lib/users/server";
import { getWalletSessionService } from "./wallet-session-server";
import type { WalletSessionSnapshot } from "./wallet-session-store";

export async function refreshWalletSessionFromDb(
  sessionId: string,
): Promise<WalletSessionSnapshot | null> {
  const sessionService = await getWalletSessionService();
  const userService = await getUserService();
  const existing = await sessionService.resolve(sessionId);
  if (!existing) {
    return null;
  }

  const user = await userService.getAuthenticatedByAddress(existing.address);
  if (!user) {
    await sessionService.revoke(sessionId);
    return null;
  }

  userService.assertActive(user);
  return sessionService.refreshFromAuthenticatedUser(sessionId, user);
}
