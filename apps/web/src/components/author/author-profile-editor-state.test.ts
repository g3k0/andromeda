import { describe, expect, it } from "vitest";
import { AUTHOR_DISPLAY_NAME_MAX_LENGTH } from "@/lib/authors/field-limits";
import type { AuthorProfile } from "@/lib/authors/types";
import {
  applyDisplayNameInput,
  buildSavePayload,
  createEditorFormState,
  resetEditorFormState,
  sanitizeDisplayNameInput,
  validateAvatarUrl,
  validateDisplayName,
} from "./author-profile-editor-state";

const profile: AuthorProfile = {
  address: "0xabcdef0123456789abcdef0123456789abcdef01",
  displayName: "Jane Doe",
  avatarUrl: null,
  createdAt: "2026-06-03T12:00:00.000Z",
};

describe("author profile editor state", () => {
  it("creates initial form state from profile", () => {
    expect(createEditorFormState(profile)).toEqual({
      displayName: "Jane Doe",
      avatarUrl: null,
      displayNameError: null,
      avatarError: null,
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

  it("validates display name", () => {
    expect(validateDisplayName("")).toBe("Display name is required.");
    expect(validateDisplayName("   ")).toBe("Display name is required.");
    expect(validateDisplayName("a".repeat(AUTHOR_DISPLAY_NAME_MAX_LENGTH + 1))).toBe(
      `Display name must be ${AUTHOR_DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
    );
    expect(validateDisplayName("<script>")).toBe(
      "Display name contains invalid characters.",
    );
    expect(validateDisplayName("  Valid Name  ")).toBeNull();
  });

  it("validates avatar data URLs", () => {
    expect(validateAvatarUrl(null)).toBeNull();
    expect(validateAvatarUrl("data:image/png;base64,abc")).toBeNull();
    expect(validateAvatarUrl("javascript:alert(1)")).toBe(
      "Allowed formats: PNG, JPEG, WebP.",
    );
  });

  it("builds save payload with trimmed display name", () => {
    const result = buildSavePayload({
      displayName: "  Updated  ",
      avatarUrl: "data:image/png;base64,x",
      displayNameError: null,
      avatarError: null,
      errorMessage: null,
      isSaving: false,
    });

    expect(result).toEqual({
      payload: {
        displayName: "Updated",
        avatarUrl: "data:image/png;base64,x",
      },
      error: null,
    });
  });

  it("returns validation error when save payload is invalid", () => {
    expect(
      buildSavePayload({
        displayName: "",
        avatarUrl: null,
        displayNameError: null,
        avatarError: null,
        errorMessage: null,
        isSaving: false,
      }),
    ).toEqual({
      payload: null,
      error: "Display name is required.",
    });
  });

  it("rejects invalid avatar URLs when saving", () => {
    expect(
      buildSavePayload({
        displayName: "Writer",
        avatarUrl: "not-an-image",
        displayNameError: null,
        avatarError: null,
        errorMessage: null,
        isSaving: false,
      }),
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
    });

    expect(reset.displayName).toBe("Changed");
    expect(reset.avatarUrl).toBe("ipfs://x");
    expect(reset.displayNameError).toBeNull();
    expect(reset.avatarError).toBeNull();
    expect(reset.errorMessage).toBeNull();
  });
});
