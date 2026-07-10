import { describe, expect, it } from "vitest";
import { AUTHOR_DISPLAY_NAME_MAX_LENGTH } from "@/lib/authors/field-limits";
import { createTranslateFn } from "@/lib/i18n/translate";
import type { AuthorProfile } from "@/lib/authors/types";
import {
  applyBioInput,
  applyDisplayNameInput,
  buildSavePayload,
  createEditorFormState,
  resetEditorFormState,
  sanitizeDisplayNameInput,
  validateAvatarUrl,
  validateDisplayName,
} from "./author-profile-editor-state";

const t = createTranslateFn("en");

const profile: AuthorProfile = {
  address: "0xabcdef0123456789abcdef0123456789abcdef01",
  displayName: "Jane Doe",
  avatarUrl: null,
  bio: null,
  createdAt: "2026-06-03T12:00:00.000Z",
};

describe("author profile editor state", () => {
  it("creates initial form state from profile", () => {
    expect(createEditorFormState(profile)).toEqual({
      displayName: "Jane Doe",
      avatarUrl: null,
      bio: "",
      displayNameError: null,
      avatarError: null,
      bioError: null,
      errorMessage: null,
      isSaving: false,
    });
  });

  it("strips control characters and angle brackets from display name input", () => {
    expect(sanitizeDisplayNameInput("Ada<script>\u0007")).toBe("Adascript");
    expect(applyDisplayNameInput(` ${"a".repeat(80)} `)).toHaveLength(
      AUTHOR_DISPLAY_NAME_MAX_LENGTH,
    );
  });

  it("sanitizes bio input while preserving newlines", () => {
    expect(applyBioInput("Line one\nLine two\u0007")).toBe("Line one\nLine two");
  });

  it("validates display name", () => {
    expect(validateDisplayName("", t)).toBe("Display name is required.");
    expect(validateDisplayName("   ", t)).toBe("Display name is required.");
    expect(validateDisplayName("a".repeat(AUTHOR_DISPLAY_NAME_MAX_LENGTH + 1), t)).toBe(
      `Display name must be ${AUTHOR_DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
    );
    expect(validateDisplayName("<script>", t)).toBe(
      "Display name contains invalid characters.",
    );
    expect(validateDisplayName("  Valid Name  ", t)).toBeNull();
  });

  it("validates avatar data URLs", () => {
    expect(validateAvatarUrl(null, t)).toBeNull();
    expect(validateAvatarUrl("data:image/png;base64,abc", t)).toBeNull();
    expect(validateAvatarUrl("javascript:alert(1)", t)).toBe(
      "Allowed formats: PNG, JPEG, WebP.",
    );
  });

  it("builds save payload with trimmed display name and normalized bio", () => {
    const result = buildSavePayload(
      {
        displayName: "  Updated  ",
        avatarUrl: "data:image/png;base64,x",
        bio: "  Public bio.  ",
        bioError: null,
        displayNameError: null,
        avatarError: null,
        errorMessage: null,
        isSaving: false,
      },
      t,
    );

    expect(result).toEqual({
      payload: {
        displayName: "Updated",
        avatarUrl: "data:image/png;base64,x",
        bio: "Public bio.",
      },
      error: null,
    });
  });

  it("returns validation error when save payload is invalid", () => {
    expect(
      buildSavePayload(
        {
          displayName: "",
          avatarUrl: null,
          bio: "",
          bioError: null,
          displayNameError: null,
          avatarError: null,
          errorMessage: null,
          isSaving: false,
        },
        t,
      ),
    ).toEqual({
      payload: null,
      error: "Display name is required.",
    });
  });

  it("rejects invalid avatar URLs when saving", () => {
    expect(
      buildSavePayload(
        {
          displayName: "Writer",
          avatarUrl: "not-an-image",
          bio: "",
          bioError: null,
          displayNameError: null,
          avatarError: null,
          errorMessage: null,
          isSaving: false,
        },
        t,
      ),
    ).toEqual({
      payload: null,
      error: "Allowed formats: PNG, JPEG, WebP.",
    });
  });

  it("resets form state from profile", () => {
    const reset = resetEditorFormState({
      ...profile,
      displayName: "Changed",
      avatarUrl: "ipfs://x",
      bio: "Updated bio",
    });

    expect(reset.displayName).toBe("Changed");
    expect(reset.avatarUrl).toBe("ipfs://x");
    expect(reset.bio).toBe("Updated bio");
    expect(reset.displayNameError).toBeNull();
    expect(reset.avatarError).toBeNull();
    expect(reset.bioError).toBeNull();
    expect(reset.errorMessage).toBeNull();
  });
});
