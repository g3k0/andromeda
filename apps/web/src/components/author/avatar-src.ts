import { AUTHOR_AVATAR_PLACEHOLDER_PATH } from "./constants";

export function resolveAuthorAvatarSrc(avatarUrl: string | null): string {
  const trimmed = avatarUrl?.trim();
  if (trimmed) {
    return trimmed;
  }
  return AUTHOR_AVATAR_PLACEHOLDER_PATH;
}
