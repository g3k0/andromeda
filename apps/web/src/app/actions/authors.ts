"use server";

import { enforceActionRateLimit } from "@/lib/auth/action-rate-limit";
import {
  runCreateAuthorMutation,
  runSetWalletPreferencesMutation,
  runUpdateAuthorMutation,
} from "@/lib/authors/author-mutations";
import {
  createAuthorBodySchema,
  updateAuthorActionSchema,
  walletPreferencesBodySchema,
} from "@/lib/authors/schemas";
import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";

export async function createAuthorAction(
  input: unknown,
): Promise<AuthorProfile> {
  const body = createAuthorBodySchema.parse(input);
  await enforceActionRateLimit(`create-author:${body.address}`);
  return runCreateAuthorMutation(body);
}

export async function updateAuthorAction(
  input: unknown,
): Promise<AuthorProfile> {
  const body = updateAuthorActionSchema.parse(input);
  await enforceActionRateLimit(`patch-author:${body.targetAddress}`);
  return runUpdateAuthorMutation(body.targetAddress, body);
}

export async function setWalletPreferencesAction(
  input: unknown,
): Promise<WalletPreferences> {
  const body = walletPreferencesBodySchema.parse(input);
  await enforceActionRateLimit(`wallet-preferences:${body.address}`);
  return runSetWalletPreferencesMutation(body.address, body);
}
