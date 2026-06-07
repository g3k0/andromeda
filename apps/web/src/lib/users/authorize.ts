import { WalletAuthorizationError } from "@/lib/auth/errors";
import { normalizeAddress } from "@/lib/authors/address";
import { hasPermission } from "./permissions";
import type { User } from "./types";

export function canReadUser(signer: User, targetAddress: string): boolean {
  const target = normalizeAddress(targetAddress);
  if (!target) {
    return false;
  }
  if (signer.address === target) {
    return true;
  }
  return hasPermission(signer, "users:read");
}

export function canListUsers(signer: User): boolean {
  return hasPermission(signer, "users:read");
}

export function canWriteUser(signer: User): boolean {
  return hasPermission(signer, "users:write");
}

export function canDeleteUser(signer: User): boolean {
  return hasPermission(signer, "users:delete");
}

export function canAccessAdmin(user: User): boolean {
  return hasPermission(user, "admin:access");
}

export function canCreateOwnAuthorProfile(
  signer: User,
  targetAddress: string,
  hasAuthorProfile: boolean,
): boolean {
  const owner = normalizeAddress(targetAddress);
  if (!owner || signer.address !== owner) {
    return false;
  }

  if (hasPermission(signer, "authors:write:own")) {
    return true;
  }

  return signer.role === "reader" && !hasAuthorProfile;
}

export function canEditAuthorProfile(
  signer: User,
  profileOwnerAddress: string,
): boolean {
  if (hasPermission(signer, "authors:write:any")) {
    return true;
  }

  const owner = normalizeAddress(profileOwnerAddress);
  if (!owner) {
    return false;
  }

  return (
    hasPermission(signer, "authors:write:own") && signer.address === owner
  );
}

export function assertCanReadUser(signer: User, targetAddress: string): void {
  if (!canReadUser(signer, targetAddress)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanListUsers(signer: User): void {
  if (!canListUsers(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanWriteUser(signer: User): void {
  if (!canWriteUser(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanDeleteUser(signer: User): void {
  if (!canDeleteUser(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanAccessAdmin(user: User): void {
  if (!canAccessAdmin(user)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanCreateOwnAuthorProfile(
  signer: User,
  targetAddress: string,
  hasAuthorProfile: boolean,
): void {
  if (!canCreateOwnAuthorProfile(signer, targetAddress, hasAuthorProfile)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanEditAuthorProfile(
  signer: User,
  profileOwnerAddress: string,
): void {
  if (!canEditAuthorProfile(signer, profileOwnerAddress)) {
    throw new WalletAuthorizationError();
  }
}
