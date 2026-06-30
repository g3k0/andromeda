import { AUTHOR_BIO_MAX_LENGTH } from "./field-limits";

const UNSAFE_BIO_CONTROL_CHARS = /[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export function containsUnsafeBioControlCharacters(value: string): boolean {
  return UNSAFE_BIO_CONTROL_CHARS.test(value);
}

export function sanitizeBioInput(value: string): string {
  return value
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, AUTHOR_BIO_MAX_LENGTH);
}

export function validateAuthorBio(bio: string): string | null {
  const trimmed = bio.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > AUTHOR_BIO_MAX_LENGTH) {
    return `Bio must be ${AUTHOR_BIO_MAX_LENGTH} characters or fewer.`;
  }
  if (containsUnsafeBioControlCharacters(trimmed)) {
    return "Bio contains invalid characters.";
  }
  return null;
}

export function normalizeAuthorBioForSave(bio: string): string | null {
  const trimmed = bio.trim();
  return trimmed ? trimmed : null;
}

export function bioToFormValue(bio: string | null): string {
  return bio ?? "";
}
