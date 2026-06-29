import { AuthorProfileNotFoundError } from "@/lib/authors/errors";
import { assertCanCreateAuthorProfile } from "@/lib/authors/authorize";
import { WalletAuthorizationError } from "@/lib/auth/errors";

export function assertCanPublishWork(
  signerAddress: string,
  targetAddress: string,
  hasAuthorProfile: boolean,
): void {
  assertCanCreateAuthorProfile(signerAddress, targetAddress);

  if (!hasAuthorProfile) {
    throw new AuthorProfileNotFoundError(targetAddress);
  }
}

export function assertSignerIsAuthor(
  signerAddress: string,
  authorAddress: string,
): void {
  if (signerAddress.toLowerCase() !== authorAddress.toLowerCase()) {
    throw new WalletAuthorizationError();
  }
}
