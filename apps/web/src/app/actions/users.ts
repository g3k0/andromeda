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

  const snapshot = await userService.getSnapshot(authorizedAddress, true, {
    hasAuthorProfile: (normalized) => authorService.hasAuthorProfile(normalized),
  });
  const walletPreferences =
    await authorService.getWalletPreferences(authorizedAddress);

  // #region agent log
  fetch("http://127.0.0.1:7933/ingest/f893043c-5c97-4d7c-a866-e6f7fc139f26", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "4321f4",
    },
    body: JSON.stringify({
      sessionId: "4321f4",
      runId: "pre-fix",
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
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return snapshot;
}
