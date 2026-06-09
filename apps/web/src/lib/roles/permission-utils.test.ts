import { describe, expect, it } from "vitest";
import { InvalidRolePermissionsError } from "./errors";
import {
  assertAdminRolePermissions,
  assertKnownPermissions,
} from "./permission-utils";

describe("role permission utils", () => {
  it("accepts known permissions", () => {
    expect(assertKnownPermissions(["pages:read", "roles:read"])).toEqual([
      "pages:read",
      "roles:read",
    ]);
  });

  it("rejects unknown permissions", () => {
    expect(() => assertKnownPermissions(["pages:read", "invalid:perm"])).toThrow(
      InvalidRolePermissionsError,
    );
  });

  it("requires admin role to keep critical permissions", () => {
    expect(() =>
      assertAdminRolePermissions("admin", ["pages:read"]),
    ).toThrow(InvalidRolePermissionsError);

    expect(() =>
      assertAdminRolePermissions("reader", ["pages:read"]),
    ).not.toThrow();
  });
});
