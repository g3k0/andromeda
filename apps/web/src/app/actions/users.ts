"use server";

import { getAuthorService } from "@/lib/authors/server";
import { getUserService } from "@/lib/users/server";

export async function findOrCreateUserOnConnectAction(
  address: string | undefined,
) {
  if (!address) {
    return null;
  }

  const service = await getUserService();
  return service.findOrCreateByWallet(address);
}

export async function getUserSnapshotAction(
  address: string | undefined,
  isConnected: boolean,
) {
  const userService = await getUserService();
  const authorService = await getAuthorService();

  if (isConnected && address) {
    await userService.findOrCreateByWallet(address);
  }

  return userService.getSnapshot(address, isConnected, {
    hasAuthorProfile: (normalized) => authorService.hasAuthorProfile(normalized),
  });
}
