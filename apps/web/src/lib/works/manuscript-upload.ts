import {
  ALLOWED_WORK_MANUSCRIPT_EXTENSIONS,
  isAllowedWorkManuscriptExtension,
  isAllowedWorkManuscriptMimeType,
  MAX_WORK_MANUSCRIPT_BYTES,
  MAX_WORK_MANUSCRIPT_MB,
} from "./upload-limits";

export const MAX_MANUSCRIPT_FILENAME_LENGTH = 255;

export class InvalidManuscriptFileError extends Error {
  constructor(message: string) {
    super(message);
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
    throw new InvalidManuscriptFileError("Manuscript filename is required.");
  }
  if (filename.length > MAX_MANUSCRIPT_FILENAME_LENGTH) {
    throw new InvalidManuscriptFileError("Manuscript filename is too long.");
  }
  if (/[\0/\\]/.test(filename) || filename.includes("..")) {
    throw new InvalidManuscriptFileError("Manuscript filename is invalid.");
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
    `Allowed formats: ${ALLOWED_WORK_MANUSCRIPT_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase()).join(", ")}.`,
  );
}

export function validateManuscriptFile(file: File): void {
  validateManuscriptFilename(file.name);

  if (file.size <= 0) {
    throw new InvalidManuscriptFileError("Manuscript file is empty.");
  }

  if (file.size > MAX_WORK_MANUSCRIPT_BYTES) {
    throw new InvalidManuscriptFileError(
      `Manuscript must be ${MAX_WORK_MANUSCRIPT_MB} MB or smaller.`,
    );
  }

  const extension = getNormalizedExtension(file.name);
  if (!isAllowedWorkManuscriptExtension(extension)) {
    throw new InvalidManuscriptFileError(
      `Allowed formats: ${ALLOWED_WORK_MANUSCRIPT_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase()).join(", ")}.`,
    );
  }

  validateManuscriptMimeType(file, extension);
}

export function validateManuscriptBytes(bytes: Uint8Array, filename: string): void {
  const extension = getNormalizedExtension(filename);
  const kind = resolveManuscriptKind(extension);

  if (!kind) {
    throw new InvalidManuscriptFileError("Unsupported manuscript format.");
  }

  if (bytes.length > MAX_WORK_MANUSCRIPT_BYTES) {
    throw new InvalidManuscriptFileError(
      `Manuscript must be ${MAX_WORK_MANUSCRIPT_MB} MB or smaller.`,
    );
  }

  switch (kind) {
    case "pdf":
      if (!startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46])) {
        throw new InvalidManuscriptFileError("File content does not match PDF format.");
      }
      return;
    case "doc":
      if (!startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0])) {
        throw new InvalidManuscriptFileError("File content does not match DOC format.");
      }
      return;
    case "docx":
      if (!startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04])) {
        throw new InvalidManuscriptFileError("File content does not match DOCX format.");
      }
      return;
    case "rtf":
      if (!startsWithBytes(bytes, [0x7b, 0x5c, 0x72, 0x74, 0x66])) {
        throw new InvalidManuscriptFileError("File content does not match RTF format.");
      }
      return;
    case "markdown":
    case "text":
      if (!isValidUtf8Text(bytes)) {
        throw new InvalidManuscriptFileError(
          "Text manuscripts must be valid UTF-8 without null bytes.",
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

export function validateManuscriptFileForForm(file: File | null): string | null {
  if (!file) {
    return "Manuscript file is required.";
  }

  try {
    validateManuscriptFile(file);
  } catch (error) {
    return error instanceof InvalidManuscriptFileError
      ? error.message
      : "Invalid manuscript file.";
  }

  return null;
}
