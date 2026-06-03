/** Max avatar upload size for mock client-side storage (see plan step 6). */
export const MAX_AUTHOR_AVATAR_BYTES = 500_000;

export class InvalidAvatarFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAvatarFileError";
  }
}

export function validateAvatarFile(file: File): void {
  if (!file.type.startsWith("image/")) {
    throw new InvalidAvatarFileError("Only image files are allowed.");
  }
  if (file.size > MAX_AUTHOR_AVATAR_BYTES) {
    throw new InvalidAvatarFileError(
      `Image must be ${MAX_AUTHOR_AVATAR_BYTES} bytes or smaller.`,
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
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new InvalidAvatarFileError("Failed to read image file."));
    };
    reader.onerror = () => {
      reject(new InvalidAvatarFileError("Failed to read image file."));
    };
    reader.readAsDataURL(file);
  });
}
