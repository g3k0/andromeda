import { afterEach, describe, expect, it } from "vitest";
import { setAdminAddressesForTests } from "@/lib/auth/admin";
import { WalletAuthorizationError } from "@/lib/auth/errors";
import {
  assertCanUpdateAuthorProfile,
  canCreateAuthorProfile,
  canUpdateAuthorProfile,
} from "./authorize";

const OWNER = "0xabcdef0123456789abcdef0123456789abcdef01";
const ADMIN = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";

describe("authorize", () => {
  afterEach(() => {
    setAdminAddressesForTests(null);
  });

  it("allows owners to create their own profile", () => {
    expect(canCreateAuthorProfile(OWNER, OWNER)).toBe(true);
    expect(canCreateAuthorProfile(OWNER, OTHER)).toBe(false);
  });

  it("allows owners and admins to update profiles", () => {
    setAdminAddressesForTests([ADMIN]);
    expect(canUpdateAuthorProfile(OWNER, OWNER)).toBe(true);
    expect(canUpdateAuthorProfile(ADMIN, OWNER)).toBe(true);
    expect(canUpdateAuthorProfile(OTHER, OWNER)).toBe(false);
  });

  it("throws when a non-admin updates another profile", () => {
    expect(() => assertCanUpdateAuthorProfile(OTHER, OWNER)).toThrow(
      WalletAuthorizationError,
    );
  });
});
