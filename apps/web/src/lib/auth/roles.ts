import { normalizeAddress } from "@/lib/authors/address";

export type UserRole = "admin" | "author" | "reader";

export type GetUserRoleParams = {
  address: string | null | undefined;
  isConnected: boolean;
  hasAuthorProfile: boolean;
  isAdmin: boolean;
};

export function getUserRole(params: GetUserRoleParams): UserRole {
  const { address, isConnected, hasAuthorProfile, isAdmin } = params;

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
