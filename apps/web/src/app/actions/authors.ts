"use server";

import {
  assertCanCreateAuthorProfile,
  assertCanManageWalletPreferences,
  assertCanUpdateAuthorProfile,
} from "@/lib/authors/authorize";
import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import {
  createAuthorBodySchema,
  updateAuthorActionSchema,
  walletPreferencesBodySchema,
} from "@/lib/authors/schemas";
import { getAuthorService } from "@/lib/authors/server";
import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";

export async function createAuthorAction(
  input: unknown,
): Promise<AuthorProfile> {
  const body = createAuthorBodySchema.parse(input);
  const signer = await verifySignedMutation(body);
  assertCanCreateAuthorProfile(signer, body.address);

  const service = await getAuthorService();
  return service.createAuthorProfile(body.address, {
    displayName: body.displayName,
    avatarUrl: body.avatarUrl ?? null,
  });
}

export async function updateAuthorAction(
  input: unknown,
): Promise<AuthorProfile> {
  const body = updateAuthorActionSchema.parse(input);
  const signer = await verifySignedMutation(body);
  assertCanUpdateAuthorProfile(signer, body.targetAddress);

  const service = await getAuthorService();
  const existing = await service.getAuthorByAddress(body.targetAddress);
  if (!existing) {
    throw new Error("Author profile not found.");
  }

  return service.upsertAuthor({
    ...existing,
    displayName: body.displayName,
    avatarUrl: body.avatarUrl ?? null,
  });
}

export async function setWalletPreferencesAction(
  input: unknown,
): Promise<WalletPreferences> {
  const body = walletPreferencesBodySchema.parse(input);
  const signer = await verifySignedMutation(body);
  assertCanManageWalletPreferences(signer, body.address);

  const service = await getAuthorService();
  return service.setWalletPreferences(body.address, {
    declinedAuthorPage: body.declinedAuthorPage,
  });
}
