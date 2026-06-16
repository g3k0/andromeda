"use server";

import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import { enforceActionRateLimit } from "@/lib/auth/action-rate-limit";
import { verifyAuth } from "@/lib/auth/require-auth";
import { refreshWalletSessionFromDb } from "@/lib/auth/refresh-wallet-session";
import { setWalletBindingCookie } from "@/lib/auth/set-wallet-binding-cookie";
import {
  parseCookieHeader,
  WALLET_SESSION_COOKIE_NAME,
} from "@/lib/auth/wallet-session-cookies";
import {
  runCreateAuthorMutation,
  runSetWalletPreferencesMutation,
  runUpdateAuthorMutation,
} from "@/lib/authors/author-mutations";
import { getAuthorService } from "@/lib/authors/server";
import {
  createAuthorBodySchema,
  updateAuthorActionSchema,
  walletPreferencesBodySchema,
} from "@/lib/authors/schemas";
import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";
import { getUserService } from "@/lib/users/server";
import type { UserSnapshot } from "@/lib/users/types";

export type CreateAuthorActionResult = {
  profile: AuthorProfile;
  snapshot: UserSnapshot;
};

export type SetWalletPreferencesActionResult = {
  preferences: WalletPreferences;
  snapshot: UserSnapshot;
};

async function refreshWalletSessionFromRequestCookies(): Promise<void> {
  const headerList = await headers();
  const sessionId = parseCookieHeader(
    headerList.get("cookie"),
    WALLET_SESSION_COOKIE_NAME,
  );

  if (sessionId) {
    await refreshWalletSessionFromDb(sessionId);
  }
}

async function buildUserSnapshot(
  address: string,
  failureMessage: string,
): Promise<UserSnapshot> {
  const [userService, authorService] = await Promise.all([
    getUserService(),
    getAuthorService(),
  ]);
  const snapshot = await userService.getSnapshot(address, true, {
    hasAuthorProfile: (normalized) =>
      authorService.hasAuthorProfile(normalized),
  });

  if (!snapshot) {
    throw new Error(failureMessage);
  }

  return snapshot;
}

export async function createAuthorAction(
  input: unknown,
): Promise<CreateAuthorActionResult> {
  noStore();

  const body = createAuthorBodySchema.parse(input);
  await Promise.all([
    verifyAuth(body),
    enforceActionRateLimit(`create-author:${body.address}`),
  ]);
  const profile = await runCreateAuthorMutation(body);
  await Promise.all([
    setWalletBindingCookie(body.address),
    refreshWalletSessionFromRequestCookies(),
  ]);
  const snapshot = await buildUserSnapshot(
    body.address,
    "Failed to build user snapshot after author creation.",
  );

  return { profile, snapshot };
}

export async function updateAuthorAction(
  input: unknown,
): Promise<AuthorProfile> {
  const body = updateAuthorActionSchema.parse(input);
  await Promise.all([
    verifyAuth(body),
    enforceActionRateLimit(`patch-author:${body.targetAddress}`),
  ]);
  return runUpdateAuthorMutation(body.targetAddress, body);
}

export async function setWalletPreferencesAction(
  input: unknown,
): Promise<SetWalletPreferencesActionResult> {
  noStore();

  const body = walletPreferencesBodySchema.parse(input);
  await Promise.all([
    verifyAuth(body),
    enforceActionRateLimit(`wallet-preferences:${body.address}`),
  ]);
  const preferences = await runSetWalletPreferencesMutation(body.address, body);
  const snapshot = await buildUserSnapshot(
    body.address,
    "Failed to build user snapshot after updating wallet preferences.",
  );

  return { preferences, snapshot };
}
