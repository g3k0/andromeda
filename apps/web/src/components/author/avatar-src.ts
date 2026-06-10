import { AUTHOR_AVATAR_PLACEHOLDER_PATH } from "./constants";

export function resolveAuthorAvatarSrc(avatarUrl: string | null): string {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) {
    return AUTHOR_AVATAR_PLACEHOLDER_PATH;
  }

  if (trimmed.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${trimmed.slice("ipfs://".length)}`;
  }

  return trimmed;
}
