import { AUTHOR_AVATAR_URL_MAX_LENGTH } from "@/lib/authors/field-limits";
import type { TranslationParams } from "@/lib/i18n/types";

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
  constructor(
    public readonly code: string,
    public readonly params?: TranslationParams,
  ) {
    super(code);
    this.name = "InvalidAvatarFileError";
  }
}

export function validateAvatarFile(file: File): void {
  if (
    !AUTHOR_AVATAR_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof AUTHOR_AVATAR_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new InvalidAvatarFileError("authorProfile.validation.avatarFormat", {
      formats: "PNG, JPEG, WebP",
    });
  }

  if (file.size > MAX_AUTHOR_AVATAR_BYTES) {
    throw new InvalidAvatarFileError("authorProfile.validation.avatarMaxSize", {
      maxKb: String(AUTHOR_AVATAR_MAX_KB),
    });
  }
}

export function validateAvatarDataUrl(dataUrl: string): void {
  if (!AUTHOR_AVATAR_DATA_URL_PATTERN.test(dataUrl)) {
    throw new InvalidAvatarFileError("authorProfile.validation.avatarFormat", {
      formats: "PNG, JPEG, WebP",
    });
  }

  if (dataUrl.length > AUTHOR_AVATAR_URL_MAX_LENGTH) {
    throw new InvalidAvatarFileError("authorProfile.validation.avatarMaxSize", {
      maxKb: String(AUTHOR_AVATAR_MAX_KB),
    });
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
        reject(
          new InvalidAvatarFileError("authorProfile.validation.avatarReadFailed"),
        );
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
      reject(
        new InvalidAvatarFileError("authorProfile.validation.avatarReadFailed"),
      );
    };
    reader.readAsDataURL(file);
  });
}
