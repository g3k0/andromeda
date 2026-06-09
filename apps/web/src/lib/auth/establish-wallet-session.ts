import "server-only";

import { verifyWalletSignature, type WalletSignatureInput } from "./verify-wallet";
import { assertCanAccessAdmin } from "@/lib/users/authorize";
import { getUserService } from "@/lib/users/server";
import { UserNotFoundError } from "@/lib/users/errors";
import { getWalletSessionService } from "./wallet-session-server";
import type { EstablishedWalletSession } from "./wallet-session";

export async function establishWalletSession(
  auth: WalletSignatureInput,
): Promise<EstablishedWalletSession> {
  const address = await verifyWalletSignature(auth);
  const userService = await getUserService();
  const user = await userService.getAuthenticatedByAddress(address);
  if (!user) {
    throw new UserNotFoundError(address);
  }

  userService.assertActive(user);
  assertCanAccessAdmin(user);

  const sessionService = await getWalletSessionService();
  return sessionService.establish({
    address: user.address,
    roleSlug: user.roleSlug,
    status: user.status,
    permissions: user.permissions,
  });
}
