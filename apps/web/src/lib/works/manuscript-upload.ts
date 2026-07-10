import type { TranslationParams } from "@/lib/i18n/types";
import {
  ALLOWED_WORK_MANUSCRIPT_EXTENSIONS,
  isAllowedWorkManuscriptExtension,
  isAllowedWorkManuscriptMimeType,
  MAX_WORK_MANUSCRIPT_BYTES,
  MAX_WORK_MANUSCRIPT_MB,
} from "./upload-limits";

export const MAX_MANUSCRIPT_FILENAME_LENGTH = 255;

const MANUSCRIPT_FORMATS_LABEL = ALLOWED_WORK_MANUSCRIPT_EXTENSIONS.map((ext) =>
  ext.slice(1).toUpperCase(),
).join(", ");

export class InvalidManuscriptFileError extends Error {
  constructor(
    public readonly code: string,
    public readonly params?: TranslationParams,
  ) {
    super(code);
    this.name = "InvalidManuscriptFileError";
  }
}

const EXTENSIONS_BY_KIND = {
  pdf: [".pdf"],
  doc: [".doc"],
  docx: [".docx"],
  markdown: [".md", ".markdown"],
  text: [".txt"],
  rtf: [".rtf"],
} as const;

type ManuscriptKind = keyof typeof EXTENSIONS_BY_KIND;

function getNormalizedExtension(filename: string): string {
  const baseName = filename.split(/[/\\]/).pop() ?? filename;
  const dotIndex = baseName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return "";
  }
  return baseName.slice(dotIndex).toLowerCase();
}

function resolveManuscriptKind(extension: string): ManuscriptKind | null {
  for (const [kind, extensions] of Object.entries(EXTENSIONS_BY_KIND) as Array<
    [ManuscriptKind, readonly string[]]
  >) {
    if (extensions.includes(extension)) {
      return kind;
    }
  }
  return null;
}

function startsWithBytes(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[index] === value);
}

function isValidUtf8Text(bytes: Uint8Array): boolean {
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return !decoded.includes("\0");
  } catch {
    return false;
  }
}

function validateManuscriptFilename(filename: string): void {
  if (!filename.trim()) {
    throw new InvalidManuscriptFileError(
      "publish.validation.manuscriptFile.filenameRequired",
    );
  }
  if (filename.length > MAX_MANUSCRIPT_FILENAME_LENGTH) {
    throw new InvalidManuscriptFileError(
      "publish.validation.manuscriptFile.filenameTooLong",
    );
  }
  if (/[\0/\\]/.test(filename) || filename.includes("..")) {
    throw new InvalidManuscriptFileError(
      "publish.validation.manuscriptFile.filenameInvalid",
    );
  }
}

function validateManuscriptMimeType(file: File, extension: string): void {
  const mimeType = file.type.trim().toLowerCase();
  if (!mimeType) {
    return;
  }

  if (isAllowedWorkManuscriptMimeType(mimeType)) {
    return;
  }

  if (mimeType === "application/octet-stream" && isAllowedWorkManuscriptExtension(extension)) {
    return;
  }

  throw new InvalidManuscriptFileError(
    "publish.validation.manuscriptFile.invalidFormat",
    { formats: MANUSCRIPT_FORMATS_LABEL },
  );
}

export function validateManuscriptFile(file: File): void {
  validateManuscriptFilename(file.name);

  if (file.size <= 0) {
    throw new InvalidManuscriptFileError("publish.validation.manuscriptFile.empty");
  }

  if (file.size > MAX_WORK_MANUSCRIPT_BYTES) {
    throw new InvalidManuscriptFileError(
      "publish.validation.manuscriptFile.tooLarge",
      { maxMb: String(MAX_WORK_MANUSCRIPT_MB) },
    );
  }

  const extension = getNormalizedExtension(file.name);
  if (!isAllowedWorkManuscriptExtension(extension)) {
    throw new InvalidManuscriptFileError(
      "publish.validation.manuscriptFile.invalidFormat",
      { formats: MANUSCRIPT_FORMATS_LABEL },
    );
  }

  validateManuscriptMimeType(file, extension);
}

export function validateManuscriptBytes(bytes: Uint8Array, filename: string): void {
  const extension = getNormalizedExtension(filename);
  const kind = resolveManuscriptKind(extension);

  if (!kind) {
    throw new InvalidManuscriptFileError(
      "publish.validation.manuscriptFile.unsupported",
    );
  }

  if (bytes.length > MAX_WORK_MANUSCRIPT_BYTES) {
    throw new InvalidManuscriptFileError(
      "publish.validation.manuscriptFile.tooLarge",
      { maxMb: String(MAX_WORK_MANUSCRIPT_MB) },
    );
  }

  switch (kind) {
    case "pdf":
      if (!startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46])) {
        throw new InvalidManuscriptFileError(
          "publish.validation.manuscriptFile.contentMismatchPdf",
        );
      }
      return;
    case "doc":
      if (!startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0])) {
        throw new InvalidManuscriptFileError(
          "publish.validation.manuscriptFile.contentMismatchDoc",
        );
      }
      return;
    case "docx":
      if (!startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04])) {
        throw new InvalidManuscriptFileError(
          "publish.validation.manuscriptFile.contentMismatchDocx",
        );
      }
      return;
    case "rtf":
      if (!startsWithBytes(bytes, [0x7b, 0x5c, 0x72, 0x74, 0x66])) {
        throw new InvalidManuscriptFileError(
          "publish.validation.manuscriptFile.contentMismatchRtf",
        );
      }
      return;
    case "markdown":
    case "text":
      if (!isValidUtf8Text(bytes)) {
        throw new InvalidManuscriptFileError(
          "publish.validation.manuscriptFile.invalidUtf8",
        );
      }
  }
}

export async function readManuscriptFile(file: File): Promise<Uint8Array> {
  validateManuscriptFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  validateManuscriptBytes(bytes, file.name);
  return bytes;
}

export function validateManuscriptFileForForm(
  file: File | null,
  t: (key: string, params?: TranslationParams) => string,
): string | null {
  if (!file) {
    return t("publish.validation.manuscriptFile.required");
  }

  try {
    validateManuscriptFile(file);
  } catch (error) {
    return error instanceof InvalidManuscriptFileError
      ? t(error.code, error.params)
      : t("publish.validation.manuscriptFile.invalid");
  }

  return null;
}
