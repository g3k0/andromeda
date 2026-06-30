import { AUTHOR_DISPLAY_NAME_MAX_LENGTH } from "@/lib/authors/field-limits";
import {
  bioToFormValue,
  normalizeAuthorBioForSave,
  sanitizeBioInput,
  validateAuthorBio,
} from "@/lib/authors/author-bio-validation";
import type { AuthorProfile } from "@/lib/authors/types";
import {
  InvalidAvatarFileError,
  validateAvatarDataUrl,
} from "./avatar-upload";

export type AuthorProfileEditorSaveInput = {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type EditorFormState = {
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  displayNameError: string | null;
  avatarError: string | null;
  bioError: string | null;
  errorMessage: string | null;
  isSaving: boolean;
};

const DISPLAY_NAME_INVALID_CHARACTERS = /[\u0000-\u001F\u007F<>]/;

export function createEditorFormState(profile: AuthorProfile): EditorFormState {
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    bio: bioToFormValue(profile.bio),
    displayNameError: null,
    avatarError: null,
    bioError: null,
    errorMessage: null,
    isSaving: false,
  };
}

export function sanitizeDisplayNameInput(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "");
}

export function applyDisplayNameInput(value: string): string {
  return sanitizeDisplayNameInput(value).slice(0, AUTHOR_DISPLAY_NAME_MAX_LENGTH);
}

export function applyBioInput(value: string): string {
  return sanitizeBioInput(value);
}

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Display name is required.";
  }
  if (trimmed.length > AUTHOR_DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be ${AUTHOR_DISPLAY_NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (DISPLAY_NAME_INVALID_CHARACTERS.test(value)) {
    return "Display name contains invalid characters.";
  }
  return null;
}

export function validateAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) {
    return null;
  }

  try {
    validateAvatarDataUrl(avatarUrl);
    return null;
  } catch (error) {
    return error instanceof InvalidAvatarFileError
      ? error.message
      : "Invalid image.";
  }
}

export function buildSavePayload(
  state: EditorFormState,
): { payload: AuthorProfileEditorSaveInput; error: null } | { payload: null; error: string } {
  const displayNameError = validateDisplayName(state.displayName);
  if (displayNameError) {
    return { payload: null, error: displayNameError };
  }

  const avatarError = validateAvatarUrl(state.avatarUrl);
  if (avatarError) {
    return { payload: null, error: avatarError };
  }

  const bioError = validateAuthorBio(state.bio);
  if (bioError) {
    return { payload: null, error: bioError };
  }

  return {
    payload: {
      displayName: state.displayName.trim(),
      avatarUrl: state.avatarUrl,
      bio: normalizeAuthorBioForSave(state.bio),
    },
    error: null,
  };
}

export function resetEditorFormState(profile: AuthorProfile): EditorFormState {
  return createEditorFormState(profile);
}
