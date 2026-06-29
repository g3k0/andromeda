/** Maximum encrypted work payload accepted by the upload API (10 MiB). */
export const MAX_WORK_CIPHERTEXT_BYTES = 10 * 1024 * 1024;

/** Maximum cover image size accepted by the upload API (2 MiB). */
export const MAX_WORK_COVER_BYTES = 2 * 1024 * 1024;

export const ALLOWED_WORK_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedWorkCoverMimeType =
  (typeof ALLOWED_WORK_COVER_MIME_TYPES)[number];

export function isAllowedWorkCoverMimeType(
  value: string,
): value is AllowedWorkCoverMimeType {
  return (ALLOWED_WORK_COVER_MIME_TYPES as readonly string[]).includes(value);
}
