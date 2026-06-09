import "server-only";

import { resolveWalletAuth } from "@/lib/auth/resolve-wallet-auth";
import { assertRouteApiAccess } from "@/lib/navigation/route-guard";
import {
  assertCanDeleteRole,
  assertCanListRoles,
  assertCanWriteRole,
} from "@/lib/users/authorize";
import { walletAuthHeadersSchema } from "@/lib/users/schemas";
import { RoleNotFoundError } from "./errors";
import type { CreateRoleBody, UpdateRoleBody } from "./schemas";
import { getRoleService } from "./server";

async function resolveSignerForPath(options: {
  request?: Request;
  walletAuth?: CreateRoleBody | UpdateRoleBody | null;
  method: string;
  pathname: string;
}) {
  const signer = await resolveWalletAuth({
    cookieHeader: options.request?.headers.get("cookie"),
    walletAuth: options.walletAuth ?? tryParseWalletAuthHeaders(options.request),
  });
  assertRouteApiAccess(signer, options.method, options.pathname);
  return signer;
}

function tryParseWalletAuthHeaders(request: Request | undefined) {
  if (!request?.headers.get("x-wallet-address")) {
    return null;
  }

  const rawMessage = request.headers.get("x-wallet-message") ?? "";
  return walletAuthHeadersSchema.parse({
    address: request.headers.get("x-wallet-address"),
    message: rawMessage.includes("Andromeda wants you to sign in")
      ? rawMessage
      : Buffer.from(rawMessage, "base64url").toString("utf8"),
    signature: request.headers.get("x-wallet-signature"),
  });
}

export async function runListRolesMutation(request: Request) {
  const pathname = new URL(request.url).pathname;
  const signer = await resolveSignerForPath({
    request,
    method: request.method,
    pathname,
  });
  assertCanListRoles(signer);

  const service = await getRoleService();
  return service.list();
}

export async function runCreateRoleMutation(body: CreateRoleBody) {
  const signer = await resolveSignerForPath({
    walletAuth: body,
    method: "POST",
    pathname: "/api/roles",
  });
  assertCanWriteRole(signer);

  const service = await getRoleService();
  return service.createRole({
    slug: body.slug,
    name: body.name,
    description: body.description,
    permissions: body.permissions,
  });
}

export async function runGetRoleMutation(request: Request, slug: string) {
  const pathname = new URL(request.url).pathname;
  const signer = await resolveSignerForPath({
    request,
    method: request.method,
    pathname,
  });
  assertCanListRoles(signer);

  const service = await getRoleService();
  const role = await service.getBySlug(slug);
  if (!role) {
    throw new RoleNotFoundError(slug);
  }
  return role;
}

export async function runUpdateRoleMutation(slug: string, body: UpdateRoleBody) {
  const signer = await resolveSignerForPath({
    walletAuth: body,
    method: "PATCH",
    pathname: `/api/roles/${slug}`,
  });
  assertCanWriteRole(signer);

  const service = await getRoleService();
  return service.updateRole(slug, {
    name: body.name,
    description: body.description,
    permissions: body.permissions,
  });
}

export async function runDeleteRoleMutation(request: Request, slug: string) {
  const pathname = new URL(request.url).pathname;
  const signer = await resolveSignerForPath({
    request,
    method: request.method,
    pathname,
  });
  assertCanDeleteRole(signer);

  const service = await getRoleService();
  await service.deleteRole(slug);
}
