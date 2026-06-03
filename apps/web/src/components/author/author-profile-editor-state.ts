import type { AuthorProfile } from "@/lib/authors/types";

export type AuthorProfileEditorSaveInput = {
  displayName: string;
  avatarUrl: string | null;
};

export type EditorFormState = {
  displayName: string;
  avatarUrl: string | null;
  errorMessage: string | null;
  isSaving: boolean;
};

export function createEditorFormState(profile: AuthorProfile): EditorFormState {
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    errorMessage: null,
    isSaving: false,
  };
}

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Display name is required.";
  }
  if (trimmed.length > 80) {
    return "Display name must be 80 characters or fewer.";
  }
  return null;
}

export function buildSavePayload(
  state: EditorFormState,
): { payload: AuthorProfileEditorSaveInput; error: null } | { payload: null; error: string } {
  const validationError = validateDisplayName(state.displayName);
  if (validationError) {
    return { payload: null, error: validationError };
  }

  return {
    payload: {
      displayName: state.displayName.trim(),
      avatarUrl: state.avatarUrl,
    },
    error: null,
  };
}

export function resetEditorFormState(profile: AuthorProfile): EditorFormState {
  return createEditorFormState(profile);
}
