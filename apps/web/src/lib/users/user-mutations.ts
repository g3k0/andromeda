import "server-only";

import { resolveWalletAuth } from "@/lib/auth/resolve-wallet-auth";
import { normalizeAddress } from "@/lib/authors/address";
import { InvalidAddressError } from "@/lib/authors/errors";
import { assertRouteApiAccess } from "@/lib/navigation/route-guard";
import {
  assertCanDeleteUser,
  assertCanListUsers,
  assertCanReadUser,
  assertCanWriteUser,
} from "./authorize";
import { UserNotFoundError } from "./errors";
import type {
  CreateUserBody,
  UpdateUserBody,
  WalletAuthHeaders,
} from "./schemas";
import { walletAuthHeadersSchema } from "./schemas";
import { getUserService } from "./server";
import type { AuthenticatedUser, User } from "./types";

async function resolveSignerForPath(
  options: {
    request?: Request;
    walletAuth?: WalletAuthHeaders | null;
    method: string;
    pathname: string;
  },
): Promise<AuthenticatedUser> {
  const signer = await resolveWalletAuth({
    cookieHeader: options.request?.headers.get("cookie"),
    walletAuth: options.walletAuth ?? tryParseWalletAuthHeaders(options.request),
  });
  const service = await getUserService();
  service.assertActive(signer);
  assertRouteApiAccess(signer, options.method, options.pathname);
  return signer;
}

function tryParseWalletAuthHeaders(
  request: Request | undefined,
): WalletAuthHeaders | null {
  if (!request?.headers.get("x-wallet-address")) {
    return null;
  }

  return parseWalletAuthHeaders(request);
}

export function encodeWalletAuthHeaderMessage(message: string): string {
  return Buffer.from(message, "utf8").toString("base64url");
}

export function decodeWalletAuthHeaderMessage(raw: string): string {
  if (raw.includes("Andromeda wants you to sign in")) {
    return raw;
  }
  return Buffer.from(raw, "base64url").toString("utf8");
}

export function buildWalletAuthRequest(
  auth: WalletAuthHeaders,
  method: string,
  pathname: string,
): Request {
  return new Request(`https://andromeda.local${pathname}`, {
    method,
    headers: {
      "x-wallet-address": auth.address,
      "x-wallet-message": encodeWalletAuthHeaderMessage(auth.message),
      "x-wallet-signature": auth.signature,
    },
  });
}

export function parseWalletAuthHeaders(request: Request): WalletAuthHeaders {
  const rawMessage = request.headers.get("x-wallet-message") ?? "";

  return walletAuthHeadersSchema.parse({
    address: request.headers.get("x-wallet-address"),
    message: decodeWalletAuthHeaderMessage(rawMessage),
    signature: request.headers.get("x-wallet-signature"),
  });
}

export async function runListUsersMutation(
  request: Request,
): Promise<User[]> {
  const pathname = new URL(request.url).pathname;
  const signer = await resolveSignerForPath({
    request,
    method: request.method,
    pathname,
  });
  assertCanListUsers(signer);

  const service = await getUserService();
  return service.list();
}

export async function runCreateUserMutation(body: CreateUserBody): Promise<User> {
  const signer = await resolveSignerForPath({
    walletAuth: body,
    method: "POST",
    pathname: "/api/users",
  });
  assertCanWriteUser(signer);

  const service = await getUserService();
  return service.createUser({
    address: body.targetAddress,
    roleSlug: body.roleSlug,
    status: body.status,
    permissionOverrides: body.permissionOverrides,
  });
}

export async function runGetUserMutation(
  request: Request,
  targetAddress: string,
): Promise<User> {
  const normalized = normalizeAddress(targetAddress);
  if (!normalized) {
    throw new InvalidAddressError(targetAddress);
  }

  const pathname = new URL(request.url).pathname;
  const signer = await resolveSignerForPath({
    request,
    method: request.method,
    pathname,
  });
  assertCanReadUser(signer, normalized);

  const service = await getUserService();
  const user = await service.getByAddress(normalized);
  if (!user) {
    throw new UserNotFoundError(normalized);
  }

  return user;
}

export async function runUpdateUserMutation(
  targetAddress: string,
  body: UpdateUserBody,
): Promise<User> {
  const normalized = normalizeAddress(targetAddress);
  if (!normalized) {
    throw new InvalidAddressError(targetAddress);
  }

  const signer = await resolveSignerForPath({
    walletAuth: body,
    method: "PATCH",
    pathname: `/api/users/${normalized}`,
  });
  assertCanWriteUser(signer);

  const service = await getUserService();
  const existing = await service.getByAddress(normalized);
  if (!existing) {
    throw new UserNotFoundError(normalized);
  }

  return service.updateUser({
    ...existing,
    roleSlug: body.roleSlug ?? existing.roleSlug,
    status: body.status ?? existing.status,
    permissionOverrides:
      body.permissionOverrides ?? existing.permissionOverrides,
  });
}

export async function runDeleteUserMutation(
  request: Request,
  targetAddress: string,
): Promise<void> {
  const normalized = normalizeAddress(targetAddress);
  if (!normalized) {
    throw new InvalidAddressError(targetAddress);
  }

  const pathname = new URL(request.url).pathname;
  const signer = await resolveSignerForPath({
    request,
    method: request.method,
    pathname,
  });
  assertCanDeleteUser(signer);

  const service = await getUserService();
  await service.deleteUser(normalized);
}
