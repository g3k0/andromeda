import { ForbiddenContentKeyError, WorkUploadValidationError } from "./errors";
import {
  ALLOWED_WORK_COVER_MIME_TYPES,
  MAX_WORK_CIPHERTEXT_BYTES,
  MAX_WORK_COVER_BYTES,
  isAllowedWorkCoverMimeType,
} from "./upload-limits";

export type ParsedWorkUploadFiles = {
  ciphertext: Uint8Array;
  coverImage: Uint8Array;
  coverMimeType: string;
};

function readRequiredFile(formData: FormData, field: string): File {
  const value = formData.get(field);
  if (!(value instanceof File) || value.size === 0) {
    throw new WorkUploadValidationError(`Missing required file field: ${field}`);
  }
  return value;
}

export async function parseWorkUploadFiles(
  formData: FormData,
): Promise<ParsedWorkUploadFiles> {
  const ciphertextFile = readRequiredFile(formData, "ciphertext");
  const coverFile = readRequiredFile(formData, "coverImage");

  if (ciphertextFile.size > MAX_WORK_CIPHERTEXT_BYTES) {
    throw new WorkUploadValidationError("Encrypted content exceeds size limit.");
  }

  if (coverFile.size > MAX_WORK_COVER_BYTES) {
    throw new WorkUploadValidationError("Cover image exceeds size limit.");
  }

  const coverMimeType = coverFile.type.trim().toLowerCase();
  if (!isAllowedWorkCoverMimeType(coverMimeType)) {
    throw new WorkUploadValidationError("Unsupported cover image MIME type.", [
      `Allowed types: ${ALLOWED_WORK_COVER_MIME_TYPES.join(", ")}`,
    ]);
  }

  return {
    ciphertext: new Uint8Array(await ciphertextFile.arrayBuffer()),
    coverImage: new Uint8Array(await coverFile.arrayBuffer()),
    coverMimeType,
  };
}

export function rejectForbiddenContentKeyField(formData: FormData): void {
  for (const key of formData.keys()) {
    if (key.toLowerCase() === "contentkey" || key.toLowerCase() === "content_key") {
      throw new ForbiddenContentKeyError();
    }
  }
}
