import "server-only";

import {
  assertCanCreateOwnAuthorProfile,
  assertCanEditAuthorProfile,
} from "@/lib/users/authorize";
import { WalletAuthorizationError } from "@/lib/auth/errors";
import {
  assertCanCreateAuthorProfile,
  assertCanManageWalletPreferences,
} from "./authorize";
import { AuthorProfileNotFoundError } from "./errors";
import { verifySignedMutation } from "./mutation-handler";
import type {
  CreateAuthorBody,
  UpdateAuthorMutation,
  WalletPreferencesBody,
} from "./schemas";
import { getUserService } from "@/lib/users/server";
import { getAuthorService } from "./server";
import type { AuthorProfile, WalletPreferences } from "./types";

export async function runCreateAuthorMutation(
  body: CreateAuthorBody,
): Promise<AuthorProfile> {
  const signer = await verifySignedMutation(body);
  assertCanCreateAuthorProfile(signer, body.address);

  const [userService, service] = await Promise.all([
    getUserService(),
    getAuthorService(),
  ]);
  const signerUser = await userService.getAuthenticatedByAddress(signer);
  if (signerUser) {
    userService.assertActive(signerUser);
    const hasAuthorProfile = await service.hasAuthorProfile(body.address);
    assertCanCreateOwnAuthorProfile(
      signerUser,
      body.address,
      hasAuthorProfile,
    );
  }

  const profile = await service.createAuthorProfile(body.address, {
    displayName: body.displayName,
    avatarUrl: body.avatarUrl ?? null,
  });

  await userService.findOrCreateByWallet(body.address);
  await userService.promoteToAuthor(body.address);

  return profile;
}

export async function runUpdateAuthorMutation(
  targetAddress: string,
  body: UpdateAuthorMutation,
): Promise<AuthorProfile> {
  const signer = await verifySignedMutation(body);
  const userService = await getUserService();
  const signerUser = await userService.getAuthenticatedByAddress(signer);
  if (!signerUser) {
    throw new WalletAuthorizationError();
  }

  userService.assertActive(signerUser);
  assertCanEditAuthorProfile(signerUser, targetAddress);

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

  const [userService, authorService] = await Promise.all([
    getUserService(),
    getAuthorService(),
  ]);
  await userService.findOrCreateByWallet(targetAddress);
  await userService.setPreferences(targetAddress, {
    declinedAuthorPage: body.declinedAuthorPage,
  });
  await authorService.setWalletPreferences(targetAddress, {
    declinedAuthorPage: body.declinedAuthorPage,
  });

  return {
    declinedAuthorPage: body.declinedAuthorPage,
  };
}
