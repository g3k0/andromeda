import { describe, expect, it } from "vitest";
import type { AuthorProfile } from "@/lib/authors/types";
import {
  buildSavePayload,
  createEditorFormState,
  resetEditorFormState,
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
      errorMessage: null,
      isSaving: false,
    });
  });

  it("validates display name", () => {
    expect(validateDisplayName("")).toBe("Display name is required.");
    expect(validateDisplayName("   ")).toBe("Display name is required.");
    expect(validateDisplayName("a".repeat(81))).toBe(
      "Display name must be 80 characters or fewer.",
    );
    expect(validateDisplayName("  Valid Name  ")).toBeNull();
  });

  it("builds save payload with trimmed display name", () => {
    const result = buildSavePayload({
      displayName: "  Updated  ",
      avatarUrl: "data:image/png;base64,x",
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
        errorMessage: null,
        isSaving: false,
      }),
    ).toEqual({
      payload: null,
      error: "Display name is required.",
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
    expect(reset.errorMessage).toBeNull();
  });
});
