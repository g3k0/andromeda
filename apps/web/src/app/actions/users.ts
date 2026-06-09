"use server";

import { headers } from "next/headers";
import { resolveAuthorizedSnapshotWallet } from "@/lib/auth/resolve-snapshot-wallet";
import { getAuthorService } from "@/lib/authors/server";
import { getUserService } from "@/lib/users/server";

export async function getUserSnapshotAction(
  address: string | undefined,
  isConnected: boolean,
) {
  if (!isConnected || !address) {
    return null;
  }

  const headerList = await headers();
  const authorizedAddress = await resolveAuthorizedSnapshotWallet(
    address,
    headerList.get("cookie"),
  );
  if (!authorizedAddress) {
    return null;
  }

  const userService = await getUserService();
  const authorService = await getAuthorService();

  await userService.findOrCreateByWallet(authorizedAddress);

  return userService.getSnapshot(authorizedAddress, true, {
    hasAuthorProfile: (normalized) => authorService.hasAuthorProfile(normalized),
  });
}
