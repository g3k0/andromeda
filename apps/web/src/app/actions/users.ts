"use server";

import { unstable_noStore as noStore } from "next/cache";
import { checkAuth } from "@/lib/auth/require-auth";
import { getAuthorService } from "@/lib/authors/server";
import { getUserService } from "@/lib/users/server";

export async function getUserSnapshotAction(
  address: string | undefined,
  isConnected: boolean,
) {
  noStore();

  if (!isConnected || !address) {
    return null;
  }

  try {
    await checkAuth(address, isConnected);
  } catch {
    return null;
  }

  const authorizedAddress = address;

  const [userService, authorService] = await Promise.all([
    getUserService(),
    getAuthorService(),
  ]);

  await userService.findOrCreateByWallet(authorizedAddress);

  return userService.getSnapshot(authorizedAddress, true, {
    hasAuthorProfile: (normalized) => authorService.hasAuthorProfile(normalized),
  });
}
