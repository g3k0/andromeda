"use server";

import { unstable_noStore as noStore } from "next/cache";
import { checkAuth } from "@/lib/auth/require-auth";
import { getAuthorService } from "@/lib/authors/server";
import { getUserService } from "@/lib/users/server";
import { logDebugSession } from "@/lib/debug/session-log";

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

  const snapshot = await userService.getSnapshot(authorizedAddress, true, {
    hasAuthorProfile: (normalized) => authorService.hasAuthorProfile(normalized),
  });
  const walletPreferences =
    await authorService.getWalletPreferences(authorizedAddress);

  // #region agent log
  logDebugSession({
    runId: "post-fix",
    hypothesisId: "H1-H3-H4",
    location: "users.ts:getUserSnapshotAction",
    message: "User snapshot built for onboarding",
    data: snapshot
      ? {
          roleSlug: snapshot.roleSlug,
          hasAuthorProfile: snapshot.hasAuthorProfile,
          userPrefsDeclined: snapshot.declinedAuthorPage,
          walletPrefsDeclined: walletPreferences?.declinedAuthorPage ?? null,
          normalizedAddressPrefix: snapshot.normalizedAddress.slice(0, 10),
        }
      : { snapshot: null },
  });
  // #endregion

  return snapshot;
}
