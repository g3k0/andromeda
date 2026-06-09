import { describe, expect, it } from "vitest";
import { validateRoleTransition } from "./role-transitions";

describe("role transitions", () => {
  it("allows unchanged roles", () => {
    expect(
      validateRoleTransition("reader", "reader", { hasAuthorProfile: false }),
    ).toBeNull();
  });

  it("requires an author profile when promoting to author", () => {
    expect(
      validateRoleTransition("reader", "author", { hasAuthorProfile: false }),
    ).toBe("Author role requires an existing author profile.");
    expect(
      validateRoleTransition("reader", "author", { hasAuthorProfile: true }),
    ).toBeNull();
  });

  it("allows admin and reader transitions without an author profile", () => {
    expect(
      validateRoleTransition("reader", "admin", { hasAuthorProfile: false }),
    ).toBeNull();
    expect(
      validateRoleTransition("author", "reader", { hasAuthorProfile: true }),
    ).toBeNull();
  });
});
