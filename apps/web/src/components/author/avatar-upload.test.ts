import { describe, expect, it, vi } from "vitest";
import { AUTHOR_AVATAR_URL_MAX_LENGTH } from "@/lib/authors/field-limits";
import {
  InvalidAvatarFileError,
  MAX_AUTHOR_AVATAR_BYTES,
  readAvatarAsDataUrl,
  validateAvatarDataUrl,
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
  it("accepts supported image files within the size limit", () => {
    expect(() => validateAvatarFile(createFile())).not.toThrow();
    expect(() => validateAvatarFile(createFile({ type: "image/jpeg" }))).not.toThrow();
    expect(() => validateAvatarFile(createFile({ type: "image/webp" }))).not.toThrow();
  });

  it("rejects unsupported image formats", () => {
    expect(() => validateAvatarFile(createFile({ type: "image/gif" }))).toThrow(
      InvalidAvatarFileError,
    );
    expect(() => validateAvatarFile(createFile({ type: "text/plain" }))).toThrow(
      InvalidAvatarFileError,
    );
  });

  it("rejects files larger than the limit", () => {
    expect(() =>
      validateAvatarFile(createFile({ size: MAX_AUTHOR_AVATAR_BYTES + 1 })),
    ).toThrow(/128 KB/);
  });
});

describe("validateAvatarDataUrl", () => {
  it("accepts supported data URLs within the length limit", () => {
    expect(() =>
      validateAvatarDataUrl("data:image/png;base64,abc"),
    ).not.toThrow();
  });

  it("rejects unsupported data URLs", () => {
    expect(() => validateAvatarDataUrl("javascript:alert(1)")).toThrow(
      InvalidAvatarFileError,
    );
  });

  it("rejects oversized data URLs", () => {
    const oversized = `data:image/png;base64,${"a".repeat(AUTHOR_AVATAR_URL_MAX_LENGTH)}`;

    expect(() => validateAvatarDataUrl(oversized)).toThrow(/128 KB/);
  });
});

describe("readAvatarAsDataUrl", () => {
  it("resolves with the FileReader result after validation", async () => {
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

  it("rejects invalid data URLs produced by FileReader", async () => {
    const reader = {
      result: "data:image/gif;base64,abc",
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
