import {
  ALLOWED_WORK_MANUSCRIPT_EXTENSIONS,
  MAX_WORK_MANUSCRIPT_MB,
} from "./upload-limits";

export function getWorkManuscriptUploadGuidance(): string {
  const formats = ALLOWED_WORK_MANUSCRIPT_EXTENSIONS.map((ext) =>
    ext.slice(1).toUpperCase(),
  ).join(", ");

  return `Allowed formats: ${formats}. Maximum size: ${MAX_WORK_MANUSCRIPT_MB} MB. The file is encrypted in your browser before upload.`;
}

export const WORK_MANUSCRIPT_UPLOAD_ACCEPT = [
  ...ALLOWED_WORK_MANUSCRIPT_EXTENSIONS,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/rtf",
  "text/rtf",
].join(",");
