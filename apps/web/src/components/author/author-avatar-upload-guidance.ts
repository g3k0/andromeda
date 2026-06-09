import { AUTHOR_AVATAR_URL_MAX_LENGTH } from "@/lib/authors/field-limits";

export const AUTHOR_AVATAR_MAX_KB = Math.floor(
  AUTHOR_AVATAR_URL_MAX_LENGTH / 1024,
);

export const AUTHOR_AVATAR_ALLOWED_FORMATS_LABEL = "PNG, JPEG, WebP";

export const AUTHOR_AVATAR_ACCEPT_TYPES = "image/png,image/jpeg,image/webp";

export function getAuthorAvatarUploadGuidance(): string {
  return `Allowed formats: ${AUTHOR_AVATAR_ALLOWED_FORMATS_LABEL}. Maximum size: ${AUTHOR_AVATAR_MAX_KB} KB.`;
}
