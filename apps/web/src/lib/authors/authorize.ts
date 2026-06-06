import { isAdminAddress } from "@/lib/auth/admin";
import { WalletAuthorizationError } from "@/lib/auth/errors";
import { normalizeAddress } from "./address";

export function canCreateAuthorProfile(
  signerAddress: string,
  targetAddress: string,
): boolean {
  const signer = normalizeAddress(signerAddress);
  const target = normalizeAddress(targetAddress);
  return Boolean(signer && target && signer === target);
}

export function canUpdateAuthorProfile(
  signerAddress: string,
  targetAddress: string,
): boolean {
  const signer = normalizeAddress(signerAddress);
  const target = normalizeAddress(targetAddress);
  if (!signer || !target) {
    return false;
  }
  if (signer === target) {
    return true;
  }
  return isAdminAddress(signer);
}

export function canManageWalletPreferences(
  signerAddress: string,
  targetAddress: string,
): boolean {
  return canCreateAuthorProfile(signerAddress, targetAddress);
}

export function assertCanCreateAuthorProfile(
  signerAddress: string,
  targetAddress: string,
): void {
  if (!canCreateAuthorProfile(signerAddress, targetAddress)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanUpdateAuthorProfile(
  signerAddress: string,
  targetAddress: string,
): void {
  if (!canUpdateAuthorProfile(signerAddress, targetAddress)) {
    throw new WalletAuthorizationError();
  }
}

export function assertCanManageWalletPreferences(
  signerAddress: string,
  targetAddress: string,
): void {
  if (!canManageWalletPreferences(signerAddress, targetAddress)) {
    throw new WalletAuthorizationError();
  }
}
