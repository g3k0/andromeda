import { describe, expect, it, vi } from "vitest";
import {
  InvalidAvatarFileError,
  MAX_AUTHOR_AVATAR_BYTES,
  readAvatarAsDataUrl,
  validateAvatarFile,
} from "./avatar-upload";

function createFile(overrides: Partial<File> = {}): File {
  return {
    type: "image/png",
    size: 1000,
    ...overrides,
  } as File;
}

describe("validateAvatarFile", () => {
  it("accepts image files within the size limit", () => {
    expect(() => validateAvatarFile(createFile())).not.toThrow();
  });

  it("rejects non-image files", () => {
    expect(() => validateAvatarFile(createFile({ type: "text/plain" }))).toThrow(
      InvalidAvatarFileError,
    );
  });

  it("rejects files larger than the limit", () => {
    expect(() =>
      validateAvatarFile(createFile({ size: MAX_AUTHOR_AVATAR_BYTES + 1 })),
    ).toThrow(InvalidAvatarFileError);
  });
});

describe("readAvatarAsDataUrl", () => {
  it("resolves with the FileReader result", async () => {
    const reader = {
      result: "data:image/png;base64,abc",
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readAsDataURL: vi.fn(function (this: typeof reader) {
        this.onload?.();
      }),
    };

    await expect(readAvatarAsDataUrl(createFile(), reader)).resolves.toBe(
      "data:image/png;base64,abc",
    );
  });

  it("rejects when FileReader returns a non-string result", async () => {
    const reader = {
      result: null,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readAsDataURL: vi.fn(function (this: typeof reader) {
        this.onload?.();
      }),
    };

    await expect(readAvatarAsDataUrl(createFile(), reader)).rejects.toThrow(
      InvalidAvatarFileError,
    );
  });

  it("rejects when FileReader fails", async () => {
    const reader = {
      result: null,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readAsDataURL: vi.fn(function (this: typeof reader) {
        this.onerror?.();
      }),
    };

    await expect(readAvatarAsDataUrl(createFile(), reader)).rejects.toThrow(
      InvalidAvatarFileError,
    );
  });
});
