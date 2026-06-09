import { describe, expect, it } from "vitest";
import { authenticatedUserFromSessionSnapshot } from "./session-authenticated-user";

describe("authenticatedUserFromSessionSnapshot", () => {
  it("builds an authenticated user from a session snapshot", () => {
    const user = authenticatedUserFromSessionSnapshot({
      address: "0xabcdef0123456789abcdef0123456789abcdef01",
      roleSlug: "admin",
      status: "active",
      permissions: ["admin:access", "users:read"],
    });

    expect(user.permissions).toEqual(["admin:access", "users:read"]);
    expect(user.role.slug).toBe("admin");
    expect(user.roleSlug).toBe("admin");
  });
});
