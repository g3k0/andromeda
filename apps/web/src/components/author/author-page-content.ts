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

export type AuthorPageReadOnlyViewState = {
  variant: "read-only";
  audience: "visitor" | "owner";
};

export type AuthorPageEditViewState = {
  variant: "edit";
  audience: "owner" | "admin";
};

export type AuthorPageViewState =
  | AuthorPageReadOnlyViewState
  | AuthorPageEditViewState;

export type AuthorPageViewContext = {
  canEdit: boolean;
  isAdminEditingOther: boolean;
  isProfileOwner: boolean;
  isEditing: boolean;
};

export function resolveAuthorPageViewState({
  canEdit,
  isAdminEditingOther,
  isProfileOwner,
  isEditing,
}: AuthorPageViewContext): AuthorPageViewState {
  if (isEditing && canEdit) {
    return {
      variant: "edit",
      audience: isAdminEditingOther ? "admin" : "owner",
    };
  }

  return {
    variant: "read-only",
    audience: isProfileOwner ? "owner" : "visitor",
  };
}
