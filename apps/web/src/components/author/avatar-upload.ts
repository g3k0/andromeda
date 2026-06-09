import { AUTHOR_AVATAR_URL_MAX_LENGTH } from "@/lib/authors/field-limits";
import { AUTHOR_AVATAR_MAX_KB } from "./author-avatar-upload-guidance";

export const AUTHOR_AVATAR_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const AUTHOR_AVATAR_DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/;

/** Conservative raw file cap before base64 expansion exceeds the DB limit. */
export const MAX_AUTHOR_AVATAR_BYTES = Math.floor(
  ((AUTHOR_AVATAR_URL_MAX_LENGTH - 30) * 3) / 4,
);

export class InvalidAvatarFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAvatarFileError";
  }
}

export function validateAvatarFile(file: File): void {
  if (
    !AUTHOR_AVATAR_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof AUTHOR_AVATAR_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new InvalidAvatarFileError("Allowed formats: PNG, JPEG, WebP.");
  }

  if (file.size > MAX_AUTHOR_AVATAR_BYTES) {
    throw new InvalidAvatarFileError(
      `Image must be ${AUTHOR_AVATAR_MAX_KB} KB or smaller.`,
    );
  }
}

export function validateAvatarDataUrl(dataUrl: string): void {
  if (!AUTHOR_AVATAR_DATA_URL_PATTERN.test(dataUrl)) {
    throw new InvalidAvatarFileError("Allowed formats: PNG, JPEG, WebP.");
  }

  if (dataUrl.length > AUTHOR_AVATAR_URL_MAX_LENGTH) {
    throw new InvalidAvatarFileError(
      `Image must be ${AUTHOR_AVATAR_MAX_KB} KB or smaller.`,
    );
  }
}

export function readAvatarAsDataUrl(
  file: File,
  reader: Pick<FileReader, "readAsDataURL" | "result" | "onload" | "onerror"> = new FileReader(),
): Promise<string> {
  validateAvatarFile(file);

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new InvalidAvatarFileError("Failed to read image file."));
        return;
      }

      try {
        validateAvatarDataUrl(reader.result);
        resolve(reader.result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new InvalidAvatarFileError("Failed to read image file."));
    };
    reader.readAsDataURL(file);
  });
}
