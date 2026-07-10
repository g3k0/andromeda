import { describe, expect, it } from "vitest";

import {
  InvalidManuscriptFileError,
  readManuscriptFile,
  validateManuscriptBytes,
  validateManuscriptFile,
} from "./manuscript-upload";
import { MAX_WORK_MANUSCRIPT_BYTES } from "./upload-limits";

function createFile(
  bytes: Uint8Array,
  name: string,
  type = "application/octet-stream",
): File {
  return new File([Uint8Array.from(bytes)], name, { type });
}

describe("validateManuscriptFile", () => {
  it("accepts allowed extensions and sizes", () => {
    expect(() =>
      validateManuscriptFile(
        createFile(new TextEncoder().encode("Chapter 1"), "novel.txt", "text/plain"),
      ),
    ).not.toThrow();
  });

  it("rejects unsupported extensions", () => {
    expect(() =>
      validateManuscriptFile(createFile(new Uint8Array([1]), "novel.exe")),
    ).toThrow(InvalidManuscriptFileError);
  });

  it("rejects empty files", () => {
    try {
      validateManuscriptFile(createFile(new Uint8Array(), "novel.txt", "text/plain"));
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidManuscriptFileError);
      expect((error as InvalidManuscriptFileError).code).toBe(
        "publish.validation.manuscriptFile.empty",
      );
    }
  });

  it("rejects files above the manuscript size limit", () => {
    const file = createFile(new Uint8Array([1]), "novel.txt", "text/plain");
    Object.defineProperty(file, "size", {
      value: MAX_WORK_MANUSCRIPT_BYTES + 1,
    });

    try {
      validateManuscriptFile(file);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidManuscriptFileError);
      expect((error as InvalidManuscriptFileError).code).toBe(
        "publish.validation.manuscriptFile.tooLarge",
      );
    }
  });

  it("rejects invalid filenames", () => {
    try {
      validateManuscriptFile(
        createFile(new TextEncoder().encode("Chapter 1"), "../novel.txt", "text/plain"),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidManuscriptFileError);
      expect((error as InvalidManuscriptFileError).code).toBe(
        "publish.validation.manuscriptFile.filenameInvalid",
      );
    }
  });
});

describe("validateManuscriptBytes", () => {
  it("validates PDF magic bytes", () => {
    const bytes = new TextEncoder().encode("%PDF-1.7 sample");
    expect(() => validateManuscriptBytes(bytes, "book.pdf")).not.toThrow();
    expect(() => validateManuscriptBytes(bytes, "book.docx")).toThrow(
      InvalidManuscriptFileError,
    );
  });

  it("validates DOCX zip magic bytes", () => {
    const bytes = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    expect(() => validateManuscriptBytes(bytes, "book.docx")).not.toThrow();
  });

  it("validates UTF-8 text manuscripts", () => {
    const bytes = new TextEncoder().encode("# Chapter\n\nHello.");
    expect(() => validateManuscriptBytes(bytes, "book.md")).not.toThrow();
  });

  it("rejects text files with invalid UTF-8", () => {
    const bytes = Uint8Array.from([0xff, 0xfe, 0x00]);
    try {
      validateManuscriptBytes(bytes, "book.txt");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidManuscriptFileError);
      expect((error as InvalidManuscriptFileError).code).toBe(
        "publish.validation.manuscriptFile.invalidUtf8",
      );
    }
  });
});

describe("readManuscriptFile", () => {
  it("returns validated manuscript bytes", async () => {
    const bytes = new TextEncoder().encode("Once upon a time");
    const file = createFile(bytes, "novel.txt", "text/plain");

    await expect(readManuscriptFile(file)).resolves.toEqual(bytes);
  });
});
