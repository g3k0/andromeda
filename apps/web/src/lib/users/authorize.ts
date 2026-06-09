import { WalletAuthorizationError } from "@/lib/auth/errors";
import { normalizeAddress } from "@/lib/authors/address";
import { hasPermission } from "./permissions";
import type { AuthenticatedUser } from "./types";

export function canReadUser(
  signer: AuthenticatedUser,
  targetAddress: string,
): boolean {
  const target = normalizeAddress(targetAddress);
  if (!target) {
    return false;
  }
  if (signer.address === target) {
    return true;
  }
  return hasPermission(signer, "users:read");
}

export function canListUsers(signer: AuthenticatedUser): boolean {
  return hasPermission(signer, "users:read");
}

export function canWriteUser(signer: AuthenticatedUser): boolean {
  return hasPermission(signer, "users:write");
}

export function canDeleteUser(signer: AuthenticatedUser): boolean {
  return hasPermission(signer, "users:delete");
}

export function canAccessAdmin(user: AuthenticatedUser): boolean {
  return hasPermission(user, "admin:access");
}

export function canListRoles(signer: AuthenticatedUser): boolean {
  return hasPermission(signer, "roles:read");
}

export function canWriteRole(signer: AuthenticatedUser): boolean {
  return hasPermission(signer, "roles:write");
}

export function canDeleteRole(signer: AuthenticatedUser): boolean {
  return hasPermission(signer, "roles:delete");
}

export function canCreateOwnAuthorProfile(
  signer: AuthenticatedUser,
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

  return signer.roleSlug === "reader" && !hasAuthorProfile;
}

export function canEditAuthorProfile(
  signer: AuthenticatedUser,
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

export function assertCanReadUser(
  signer: AuthenticatedUser,
  targetAddress: string,
): void {
  if (!canReadUser(signer, targetAddress)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanListUsers(signer: AuthenticatedUser): void {
  if (!canListUsers(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanWriteUser(signer: AuthenticatedUser): void {
  if (!canWriteUser(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanDeleteUser(signer: AuthenticatedUser): void {
  if (!canDeleteUser(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanAccessAdmin(user: AuthenticatedUser): void {
  if (!canAccessAdmin(user)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanListRoles(signer: AuthenticatedUser): void {
  if (!canListRoles(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanWriteRole(signer: AuthenticatedUser): void {
  if (!canWriteRole(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanDeleteRole(signer: AuthenticatedUser): void {
  if (!canDeleteRole(signer)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanCreateOwnAuthorProfile(
  signer: AuthenticatedUser,
  targetAddress: string,
  hasAuthorProfile: boolean,
): void {
  if (!canCreateOwnAuthorProfile(signer, targetAddress, hasAuthorProfile)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanEditAuthorProfile(
  signer: AuthenticatedUser,
  profileOwnerAddress: string,
): void {
  if (!canEditAuthorProfile(signer, profileOwnerAddress)) {
    throw new WalletAuthorizationError();
  }
}
