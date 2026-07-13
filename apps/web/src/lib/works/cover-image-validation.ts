import type { AllowedWorkCoverMimeType } from "./upload-limits";
import { WorkUploadValidationError } from "./errors";

function startsWithBytes(
  bytes: Uint8Array,
  signature: readonly number[],
): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[index] === value);
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function isValidPng(bytes: Uint8Array): boolean {
  return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function isValidJpeg(bytes: Uint8Array): boolean {
  return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
}

function isValidWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false;
  }
  return (
    startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    readAscii(bytes, 8, 4) === "WEBP"
  );
}

/** Ensures cover bytes match the declared MIME type (magic-byte check). */
export function assertCoverImageBytesMatchMime(
  bytes: Uint8Array,
  mimeType: AllowedWorkCoverMimeType,
): void {
  const valid =
    (mimeType === "image/png" && isValidPng(bytes)) ||
    (mimeType === "image/jpeg" && isValidJpeg(bytes)) ||
    (mimeType === "image/webp" && isValidWebp(bytes));

  if (!valid) {
    throw new WorkUploadValidationError(
      "Cover image content does not match the declared MIME type.",
    );
  }
}

/** Minimal 1×1 PNG used in upload security tests. */
export const MINIMAL_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x04,
  0x00, 0x00, 0x00, 0xb5, 0x1c, 0x0c, 0x02, 0x00, 0x00, 0x00, 0x0b, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0xfc, 0xff, 0x1f, 0x00, 0x03, 0x03, 0x02, 0x00,
  0xae, 0xe9, 0x1b, 0xdb, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);
