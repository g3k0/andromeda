"use server";

import { cookies } from "next/headers";
import { enforceActionRateLimit } from "@/lib/auth/action-rate-limit";
import { resolveWalletAuth } from "@/lib/auth/resolve-wallet-auth";
import { WALLET_SESSION_COOKIE_NAME } from "@/lib/auth/wallet-session-cookies";
import { assertRouteApiAccess } from "@/lib/navigation/route-guard";
import {
  assertCanDeleteUser,
  assertCanListUsers,
  assertCanWriteUser,
} from "@/lib/users/authorize";
import {
  createUserActionSchema,
  createUserSessionBodySchema,
  deleteUserActionSchema,
  deleteUserSessionBodySchema,
  listUsersActionSchema,
  updateUserActionSchema,
  updateUserSessionBodySchema,
} from "@/lib/users/schemas";
import { getUserService } from "@/lib/users/server";
import type { AuthenticatedUser, User } from "@/lib/users/types";
import { UserNotFoundError } from "@/lib/users/errors";
import {
  runCreateUserMutation,
  runDeleteUserMutation,
  runListUsersMutation,
  runUpdateUserMutation,
  buildWalletAuthRequest,
} from "@/lib/users/user-mutations";

async function getSessionIdFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value;
}

async function resolveAdminSignerFromSession(): Promise<AuthenticatedUser> {
  const sessionId = await getSessionIdFromCookies();
  const signer = await resolveWalletAuth({ sessionId, walletAuth: null });
  const service = await getUserService();
  service.assertActive(signer);
  return signer;
}

export async function listUsersAction(input?: unknown): Promise<User[]> {
  const sessionId = await getSessionIdFromCookies();
  const walletAuth =
    input === undefined || input === null
      ? null
      : listUsersActionSchema.parse(input);

  const signer = await resolveWalletAuth({ sessionId, walletAuth });
  assertRouteApiAccess(signer, "GET", "/api/users");
  assertCanListUsers(signer);

  if (walletAuth) {
    await enforceActionRateLimit(`list-users:${walletAuth.address}`);
    return runListUsersMutation(
      buildWalletAuthRequest(walletAuth, "GET", "/api/users"),
    );
  }

  await enforceActionRateLimit(`list-users:${signer.address}`);
  const service = await getUserService();
  return service.list();
}

export async function createUserAction(input: unknown): Promise<User> {
  const sessionId = await getSessionIdFromCookies();

  if (sessionId) {
    const body = createUserSessionBodySchema.parse(input);
    const signer = await resolveAdminSignerFromSession();
    assertRouteApiAccess(signer, "POST", "/api/users");
    assertCanWriteUser(signer);
    await enforceActionRateLimit(
      `create-user:${signer.address}:${body.targetAddress}`,
    );
    const service = await getUserService();
    return service.createUser({
      address: body.targetAddress,
      roleSlug: body.roleSlug,
      status: body.status,
      permissionOverrides: body.permissionOverrides,
    });
  }

  const body = createUserActionSchema.parse(input);
  await enforceActionRateLimit(`create-user:${body.address}:${body.targetAddress}`);
  return runCreateUserMutation(body);
}

export async function updateUserAction(input: unknown): Promise<User> {
  const sessionId = await getSessionIdFromCookies();

  if (sessionId) {
    const body = updateUserSessionBodySchema.parse(input);
    const signer = await resolveAdminSignerFromSession();
    assertRouteApiAccess(signer, "PATCH", `/api/users/${body.targetAddress}`);
    assertCanWriteUser(signer);
    await enforceActionRateLimit(
      `update-user:${signer.address}:${body.targetAddress}`,
    );
    const service = await getUserService();
    const existing = await service.getByAddress(body.targetAddress);
    if (!existing) {
      throw new UserNotFoundError(body.targetAddress);
    }
    return service.updateUser({
      ...existing,
      roleSlug: body.roleSlug ?? existing.roleSlug,
      status: body.status ?? existing.status,
      permissionOverrides:
        body.permissionOverrides ?? existing.permissionOverrides,
    });
  }

  const body = updateUserActionSchema.parse(input);
  await enforceActionRateLimit(`update-user:${body.address}:${body.targetAddress}`);
  const { targetAddress, ...updateBody } = body;
  return runUpdateUserMutation(targetAddress, updateBody);
}

export async function deleteUserAction(input: unknown): Promise<void> {
  const sessionId = await getSessionIdFromCookies();

  if (sessionId) {
    const body = deleteUserSessionBodySchema.parse(input);
    const signer = await resolveAdminSignerFromSession();
    assertRouteApiAccess(signer, "DELETE", `/api/users/${body.targetAddress}`);
    assertCanDeleteUser(signer);
    await enforceActionRateLimit(
      `delete-user:${signer.address}:${body.targetAddress}`,
    );
    const service = await getUserService();
    await service.deleteUser(body.targetAddress);
    return;
  }

  const body = deleteUserActionSchema.parse(input);
  await enforceActionRateLimit(`delete-user:${body.address}:${body.targetAddress}`);
  const { targetAddress, ...auth } = body;
  await runDeleteUserMutation(
    buildWalletAuthRequest(auth, "DELETE", `/api/users/${targetAddress}`),
    targetAddress,
  );
}
