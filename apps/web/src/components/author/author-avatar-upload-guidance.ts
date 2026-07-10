import { AUTHOR_AVATAR_URL_MAX_LENGTH } from "@/lib/authors/field-limits";

export const AUTHOR_AVATAR_MAX_KB = Math.floor(
  AUTHOR_AVATAR_URL_MAX_LENGTH / 1024,
);

export const AUTHOR_AVATAR_ALLOWED_FORMATS_LABEL = "PNG, JPEG, WebP";

/** Public MIME allowlist for the avatar file picker (not a secret). */
export const AVATAR_UPLOAD_MIME_ACCEPT = "image/png,image/jpeg,image/webp";
