import { AUTHOR_BIO_MAX_LENGTH } from "./field-limits";
import type { TranslateFn } from "@/lib/i18n/translate";

const UNSAFE_BIO_CONTROL_CHARS = /[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export function containsUnsafeBioControlCharacters(value: string): boolean {
  return UNSAFE_BIO_CONTROL_CHARS.test(value);
}

export function sanitizeBioInput(value: string): string {
  return value
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, AUTHOR_BIO_MAX_LENGTH);
}

export function validateAuthorBio(bio: string, t: TranslateFn): string | null {
  const trimmed = bio.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > AUTHOR_BIO_MAX_LENGTH) {
    return t("authorProfile.validation.bioMaxLength", {
      max: String(AUTHOR_BIO_MAX_LENGTH),
    });
  }
  if (containsUnsafeBioControlCharacters(trimmed)) {
    return t("authorProfile.validation.bioInvalidChars");
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
