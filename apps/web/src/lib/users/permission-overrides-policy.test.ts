import { describe, expect, it } from "vitest";
import { InvalidPermissionOverridesError } from "./errors";
import { assertValidPermissionOverrides } from "./permission-overrides-policy";

describe("assertValidPermissionOverrides", () => {
  it("allows overrides that stay within the role permission set", () => {
    expect(() =>
      assertValidPermissionOverrides("admin", ["admin:access", "pages:read"], [
        "admin:access",
      ]),
    ).not.toThrow();
  });

  it("rejects privileged overrides on non-admin roles", () => {
    expect(() =>
      assertValidPermissionOverrides("reader", ["pages:read"], [
        "admin:access",
      ]),
    ).toThrow(InvalidPermissionOverridesError);
  });

  it("rejects overrides outside the role permission set", () => {
    expect(() =>
      assertValidPermissionOverrides("reader", ["pages:read"], [
        "users:read",
      ]),
    ).toThrow(InvalidPermissionOverridesError);
  });
});
