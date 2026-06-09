import { describe, expect, it } from "vitest";
import { WalletAuthorizationError } from "@/lib/auth/errors";
import {
  assertCanUpdateAuthorProfile,
  canCreateAuthorProfile,
  canUpdateAuthorProfile,
} from "./authorize";

const OWNER = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x2222222222222222222222222222222222222222";

describe("authorize", () => {
  it("allows owners to create their own profile", () => {
    expect(canCreateAuthorProfile(OWNER, OWNER)).toBe(true);
    expect(canCreateAuthorProfile(OWNER, OTHER)).toBe(false);
  });

  it("allows only owners to update their own profile", () => {
    expect(canUpdateAuthorProfile(OWNER, OWNER)).toBe(true);
    expect(canUpdateAuthorProfile(OTHER, OWNER)).toBe(false);
  });

  it("throws when a non-owner updates another profile", () => {
    expect(() => assertCanUpdateAuthorProfile(OTHER, OWNER)).toThrow(
      WalletAuthorizationError,
    );
  });
});
