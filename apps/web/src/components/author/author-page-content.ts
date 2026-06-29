import {
  canEditAuthorPage,
  resolveCanEditAuthorPageFromRole,
} from "@/lib/auth/roles";
import { normalizeAddress } from "@/lib/authors/address";
import type { UserRole } from "@/lib/users/types";

export type AuthorPageEditContext = {
  viewerAddress: string | null | undefined;
  isConnected: boolean;
  isAdmin: boolean;
  viewerRole?: UserRole | null;
  profileOwnerAddress: string;
};

export function resolveCanEditAuthorPage({
  viewerAddress,
  isConnected,
  isAdmin,
  viewerRole,
  profileOwnerAddress,
}: AuthorPageEditContext): boolean {
  if (!isConnected) {
    return false;
  }

  if (viewerRole) {
    return resolveCanEditAuthorPageFromRole(
      viewerRole,
      viewerAddress,
      profileOwnerAddress,
    );
  }

  return canEditAuthorPage(viewerAddress, profileOwnerAddress, isAdmin);
}

export function isAuthorProfileOwner({
  viewerAddress,
  isConnected,
  isAdmin,
  viewerRole,
  profileOwnerAddress,
}: AuthorPageEditContext): boolean {
  return (
    resolveCanEditAuthorPage({
      viewerAddress,
      isConnected,
      isAdmin,
      viewerRole,
      profileOwnerAddress,
    }) &&
    !isAdminEditingOtherAuthorPage({
      viewerAddress,
      isAdmin,
      viewerRole,
      profileOwnerAddress,
    })
  );
}

export function isAdminEditingOtherAuthorPage({
  viewerAddress,
  isAdmin,
  viewerRole,
  profileOwnerAddress,
}: Pick<
  AuthorPageEditContext,
  "viewerAddress" | "isAdmin" | "viewerRole" | "profileOwnerAddress"
>): boolean {
  const isAdminViewer = viewerRole === "admin" || isAdmin;
  if (!isAdminViewer) {
    return false;
  }
  const viewer = normalizeAddress(viewerAddress ?? "");
  const owner = normalizeAddress(profileOwnerAddress);
  return !!viewer && !!owner && viewer !== owner;
}
