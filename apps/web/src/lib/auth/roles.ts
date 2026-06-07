import { normalizeAddress } from "@/lib/authors/address";
import type { UserRole } from "@/lib/users/types";

export type { UserRole };

export type GetUserRoleParams = {
  address: string | null | undefined;
  isConnected: boolean;
  hasAuthorProfile: boolean;
  isAdmin: boolean;
  userRole?: UserRole | null;
};

export function getUserRole(params: GetUserRoleParams): UserRole {
  const { address, isConnected, hasAuthorProfile, isAdmin, userRole } = params;

  if (isConnected && address && userRole) {
    return userRole;
  }

  if (isConnected && address && isAdmin) {
    return "admin";
  }

  if (isConnected && address && hasAuthorProfile) {
    return "author";
  }

  return "reader";
}

export function canEditAuthorPage(
  viewerAddress: string | null | undefined,
  profileOwnerAddress: string,
  isAdmin: boolean,
): boolean {
  if (isAdmin) {
    return true;
  }

  const viewer = normalizeAddress(viewerAddress ?? "");
  const owner = normalizeAddress(profileOwnerAddress);
  if (!viewer || !owner) {
    return false;
  }

  return viewer === owner;
}

export function resolveCanEditAuthorPageFromRole(
  viewerRole: UserRole | null | undefined,
  viewerAddress: string | null | undefined,
  profileOwnerAddress: string,
): boolean {
  if (!viewerRole) {
    return false;
  }

  if (viewerRole === "admin") {
    return true;
  }

  if (viewerRole !== "author") {
    return false;
  }

  const viewer = normalizeAddress(viewerAddress ?? "");
  const owner = normalizeAddress(profileOwnerAddress);
  return !!viewer && !!owner && viewer === owner;
}
