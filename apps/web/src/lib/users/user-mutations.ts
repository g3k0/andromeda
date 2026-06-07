import "server-only";

import { verifyWalletSignature } from "@/lib/auth/verify-wallet";
import { normalizeAddress } from "@/lib/authors/address";
import { InvalidAddressError } from "@/lib/authors/errors";
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
import type { User } from "./types";

async function verifySigner(auth: WalletAuthHeaders): Promise<User> {
  const signerAddress = await verifyWalletSignature(auth);
  const service = await getUserService();
  const signer = await service.getByAddress(signerAddress);
  if (!signer) {
    throw new UserNotFoundError(signerAddress);
  }
  service.assertActive(signer);
  return signer;
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
  const signer = await verifySigner(parseWalletAuthHeaders(request));
  assertCanListUsers(signer);

  const service = await getUserService();
  return service.list();
}

export async function runCreateUserMutation(body: CreateUserBody): Promise<User> {
  const signerAddress = await verifyWalletSignature(body);
  const service = await getUserService();
  const signer = await service.getByAddress(signerAddress);
  if (!signer) {
    throw new UserNotFoundError(signerAddress);
  }
  service.assertActive(signer);
  assertCanWriteUser(signer);

  return service.createUser({
    address: body.targetAddress,
    role: body.role,
    status: body.status,
    permissions: body.permissions,
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

  const signer = await verifySigner(parseWalletAuthHeaders(request));
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
  const signerAddress = await verifyWalletSignature(body);
  const service = await getUserService();
  const signer = await service.getByAddress(signerAddress);
  if (!signer) {
    throw new UserNotFoundError(signerAddress);
  }
  service.assertActive(signer);
  assertCanWriteUser(signer);

  const normalized = normalizeAddress(targetAddress);
  if (!normalized) {
    throw new InvalidAddressError(targetAddress);
  }

  const existing = await service.getByAddress(normalized);
  if (!existing) {
    throw new UserNotFoundError(normalized);
  }

  return service.updateUser({
    ...existing,
    role: body.role ?? existing.role,
    status: body.status ?? existing.status,
    permissions: body.permissions ?? existing.permissions,
  });
}

export async function runDeleteUserMutation(
  request: Request,
  targetAddress: string,
): Promise<void> {
  const signer = await verifySigner(parseWalletAuthHeaders(request));
  assertCanDeleteUser(signer);

  const normalized = normalizeAddress(targetAddress);
  if (!normalized) {
    throw new InvalidAddressError(targetAddress);
  }

  const service = await getUserService();
  await service.deleteUser(normalized);
}
