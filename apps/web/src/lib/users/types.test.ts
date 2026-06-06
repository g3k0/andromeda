import { describe, expect, it } from "vitest";
import {
  defaultUserPreferences,
  isUserPermission,
  isUserRole,
  USER_PERMISSIONS,
  USER_ROLES,
} from "./types";

describe("user types", () => {
  it("recognizes valid user roles", () => {
    for (const role of USER_ROLES) {
      expect(isUserRole(role)).toBe(true);
    }
    expect(isUserRole("moderator")).toBe(false);
  });

  it("recognizes valid user permissions", () => {
    for (const permission of USER_PERMISSIONS) {
      expect(isUserPermission(permission)).toBe(true);
    }
    expect(isUserPermission("posts:write")).toBe(false);
  });

  it("returns default user preferences", () => {
    expect(defaultUserPreferences()).toEqual({
      declinedAuthorPage: false,
      onboardingCompletedAt: null,
    });
  });
});
