/** Maximum raw manuscript size before client-side encryption (32 MiB). */
export const MAX_WORK_MANUSCRIPT_BYTES = 32 * 1024 * 1024;

export const MAX_WORK_MANUSCRIPT_MB = MAX_WORK_MANUSCRIPT_BYTES / (1024 * 1024);

/** Maximum encrypted work payload accepted by the upload API. */
export const MAX_WORK_CIPHERTEXT_BYTES = MAX_WORK_MANUSCRIPT_BYTES + 1024;

/** Maximum cover image size accepted by the upload API (2 MiB). */
export const MAX_WORK_COVER_BYTES = 2 * 1024 * 1024;

export const ALLOWED_WORK_MANUSCRIPT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".md",
  ".markdown",
  ".txt",
  ".rtf",
] as const;

export type AllowedWorkManuscriptExtension =
  (typeof ALLOWED_WORK_MANUSCRIPT_EXTENSIONS)[number];

export const ALLOWED_WORK_MANUSCRIPT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/rtf",
  "text/rtf",
] as const;

export type AllowedWorkManuscriptMimeType =
  (typeof ALLOWED_WORK_MANUSCRIPT_MIME_TYPES)[number];

export function isAllowedWorkManuscriptMimeType(
  value: string,
): value is AllowedWorkManuscriptMimeType {
  return (ALLOWED_WORK_MANUSCRIPT_MIME_TYPES as readonly string[]).includes(value);
}

export function isAllowedWorkManuscriptExtension(
  value: string,
): value is AllowedWorkManuscriptExtension {
  return (ALLOWED_WORK_MANUSCRIPT_EXTENSIONS as readonly string[]).includes(
    value as AllowedWorkManuscriptExtension,
  );
}

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
