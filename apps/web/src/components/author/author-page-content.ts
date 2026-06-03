import { canEditAuthorPage } from "@/lib/auth/roles";
import { normalizeAddress } from "@/lib/authors/address";

export type AuthorPageEditContext = {
  viewerAddress: string | null | undefined;
  isConnected: boolean;
  isAdmin: boolean;
  profileOwnerAddress: string;
};

export function resolveCanEditAuthorPage({
  viewerAddress,
  isConnected,
  isAdmin,
  profileOwnerAddress,
}: AuthorPageEditContext): boolean {
  if (!isConnected) {
    return false;
  }
  return canEditAuthorPage(viewerAddress, profileOwnerAddress, isAdmin);
}

export function isAdminEditingOtherAuthorPage({
  viewerAddress,
  isAdmin,
  profileOwnerAddress,
}: Pick<
  AuthorPageEditContext,
  "viewerAddress" | "isAdmin" | "profileOwnerAddress"
>): boolean {
  if (!isAdmin) {
    return false;
  }
  const viewer = normalizeAddress(viewerAddress ?? "");
  const owner = normalizeAddress(profileOwnerAddress);
  return !!viewer && !!owner && viewer !== owner;
}
