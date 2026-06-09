"use server";

import { cookies } from "next/headers";
import { enforceActionRateLimit } from "@/lib/auth/action-rate-limit";
import { refreshWalletSessionFromDb } from "@/lib/auth/refresh-wallet-session";
import { resolveWalletAuth } from "@/lib/auth/resolve-wallet-auth";
import { WALLET_SESSION_COOKIE_NAME } from "@/lib/auth/wallet-session-cookies";
import { assertRouteApiAccess } from "@/lib/navigation/route-guard";
import {
  assertCanDeleteRole,
  assertCanListRoles,
  assertCanWriteRole,
} from "@/lib/users/authorize";
import { getRoleService } from "@/lib/roles/server";
import {
  createRoleActionSchema,
  createRoleApiBodySchema,
  deleteRoleActionSchema,
  signedDeleteRoleActionSchema,
  signedUpdateRoleActionSchema,
  updateRoleActionSchema,
} from "@/lib/roles/schemas";
import type { RoleWithUserCount } from "@/lib/roles/types";
import {
  runCreateRoleMutation,
  runDeleteRoleMutation,
  runListRolesMutation,
  runUpdateRoleMutation,
} from "@/lib/roles/role-mutations";
import { buildWalletAuthRequest } from "@/lib/users/user-mutations";
import { walletAuthSchema } from "@/lib/authors/schemas";

async function getSessionIdFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value;
}

async function resolveAdminSignerFromSession(options?: { refresh?: boolean }) {
  const sessionId = await getSessionIdFromCookies();
  if (options?.refresh && sessionId) {
    await refreshWalletSessionFromDb(sessionId);
  }
  return resolveWalletAuth({ sessionId, walletAuth: null });
}

export async function listRolesAction(input?: unknown): Promise<RoleWithUserCount[]> {
  const sessionId = await getSessionIdFromCookies();
  const walletAuth =
    input === undefined || input === null ? null : walletAuthSchema.parse(input);

  const signer = await resolveWalletAuth({ sessionId, walletAuth });
  assertRouteApiAccess(signer, "GET", "/api/roles");
  assertCanListRoles(signer);

  if (walletAuth) {
    await enforceActionRateLimit(`list-roles:${walletAuth.address}`);
    return runListRolesMutation(
      buildWalletAuthRequest(walletAuth, "GET", "/api/roles"),
    );
  }

  await enforceActionRateLimit(`list-roles:${signer.address}`);
  const service = await getRoleService();
  return service.list();
}

export async function createRoleAction(input: unknown): Promise<RoleWithUserCount> {
  const sessionId = await getSessionIdFromCookies();

  if (sessionId) {
    const body = createRoleActionSchema.parse(input);
    const signer = await resolveAdminSignerFromSession({ refresh: true });
    assertRouteApiAccess(signer, "POST", "/api/roles");
    assertCanWriteRole(signer);
    await enforceActionRateLimit(`create-role:${signer.address}:${body.slug}`);
    const service = await getRoleService();
    const role = await service.createRole(body);
    return { ...role, userCount: 0 };
  }

  const body = createRoleApiBodySchema.parse(input);
  await enforceActionRateLimit(`create-role:${body.address}:${body.slug}`);
  const role = await runCreateRoleMutation(body);
  return { ...role, userCount: 0 };
}

export async function updateRoleAction(input: unknown): Promise<RoleWithUserCount> {
  const sessionId = await getSessionIdFromCookies();

  if (sessionId) {
    const body = updateRoleActionSchema.parse(input);
    const signer = await resolveAdminSignerFromSession({ refresh: true });
    assertRouteApiAccess(signer, "PATCH", `/api/roles/${body.slug}`);
    assertCanWriteRole(signer);
    await enforceActionRateLimit(`update-role:${signer.address}:${body.slug}`);
    const service = await getRoleService();
    await service.updateRole(body.slug, {
      name: body.name,
      description: body.description,
      permissions: body.permissions,
    });
    const withCount = await service.getBySlug(body.slug);
    if (!withCount) {
      throw new Error(`Role missing after update: ${body.slug}`);
    }
    return withCount;
  }

  const body = signedUpdateRoleActionSchema.parse(input);
  await enforceActionRateLimit(`update-role:${body.address}:${body.slug}`);
  const { slug, ...updateBody } = body;
  await runUpdateRoleMutation(slug, updateBody);
  const service = await getRoleService();
  const withCount = await service.getBySlug(slug);
  if (!withCount) {
    throw new Error(`Role missing after update: ${slug}`);
  }
  return withCount;
}

export async function deleteRoleAction(input: unknown): Promise<void> {
  const sessionId = await getSessionIdFromCookies();

  if (sessionId) {
    const body = deleteRoleActionSchema.parse(input);
    const signer = await resolveAdminSignerFromSession({ refresh: true });
    assertRouteApiAccess(signer, "DELETE", `/api/roles/${body.slug}`);
    assertCanDeleteRole(signer);
    await enforceActionRateLimit(`delete-role:${signer.address}:${body.slug}`);
    const service = await getRoleService();
    await service.deleteRole(body.slug);
    return;
  }

  const body = signedDeleteRoleActionSchema.parse(input);
  await enforceActionRateLimit(`delete-role:${body.address}:${body.slug}`);
  const { slug, ...auth } = body;
  await runDeleteRoleMutation(
    buildWalletAuthRequest(auth, "DELETE", `/api/roles/${slug}`),
    slug,
  );
}
