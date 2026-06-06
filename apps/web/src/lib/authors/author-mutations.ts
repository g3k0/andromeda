import "server-only";

import {
  assertCanCreateAuthorProfile,
  assertCanManageWalletPreferences,
  assertCanUpdateAuthorProfile,
} from "./authorize";
import { AuthorProfileNotFoundError } from "./errors";
import { verifySignedMutation } from "./mutation-handler";
import type {
  CreateAuthorBody,
  UpdateAuthorMutation,
  WalletPreferencesBody,
} from "./schemas";
import { getAuthorService } from "./server";
import type { AuthorProfile, WalletPreferences } from "./types";

export async function runCreateAuthorMutation(
  body: CreateAuthorBody,
): Promise<AuthorProfile> {
  const signer = await verifySignedMutation(body);
  assertCanCreateAuthorProfile(signer, body.address);

  const service = await getAuthorService();
  return service.createAuthorProfile(body.address, {
    displayName: body.displayName,
    avatarUrl: body.avatarUrl ?? null,
  });
}

export async function runUpdateAuthorMutation(
  targetAddress: string,
  body: UpdateAuthorMutation,
): Promise<AuthorProfile> {
  const signer = await verifySignedMutation(body);
  assertCanUpdateAuthorProfile(signer, targetAddress);

  const service = await getAuthorService();
  const existing = await service.getAuthorByAddress(targetAddress);
  if (!existing) {
    throw new AuthorProfileNotFoundError(targetAddress);
  }

  return service.upsertAuthor({
    ...existing,
    displayName: body.displayName,
    avatarUrl: body.avatarUrl ?? null,
  });
}

export async function runSetWalletPreferencesMutation(
  targetAddress: string,
  body: WalletPreferencesBody,
): Promise<WalletPreferences> {
  const signer = await verifySignedMutation(body);
  assertCanManageWalletPreferences(signer, targetAddress);

  const service = await getAuthorService();
  return service.setWalletPreferences(targetAddress, {
    declinedAuthorPage: body.declinedAuthorPage,
  });
}
