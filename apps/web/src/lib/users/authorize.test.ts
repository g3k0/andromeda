import { describe, expect, it } from "vitest";
import { WalletAuthorizationError } from "@/lib/auth/errors";
import {
  assertCanAccessAdmin,
  canCreateOwnAuthorProfile,
  canEditAuthorProfile,
  canReadUser,
  canWriteUser,
} from "./authorize";
import { defaultUserPreferences } from "./types";
import type { User } from "./types";

const ADMIN = "0xabcdef0123456789abcdef0123456789abcdef01";
const AUTHOR = "0x1234567890abcdef1234567890abcdef12345678";
const READER = "0x2222222222222222222222222222222222222222";

function buildUser(address: string, role: User["role"]): User {
  return {
    address,
    role,
    status: "active",
    permissions: [],
    preferences: defaultUserPreferences(),
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("user authorize", () => {
  it("allows admins to read and write users", () => {
    const admin = buildUser(ADMIN, "admin");
    expect(canReadUser(admin, READER)).toBe(true);
    expect(canWriteUser(admin)).toBe(true);
    expect(() => assertCanAccessAdmin(admin)).not.toThrow();
  });

  it("allows self-read but not cross-user reads for readers", () => {
    const reader = buildUser(READER, "reader");
    expect(canReadUser(reader, READER)).toBe(true);
    expect(canReadUser(reader, ADMIN)).toBe(false);
    expect(canWriteUser(reader)).toBe(false);
  });

  it("allows readers to create their first author profile during onboarding", () => {
    const reader = buildUser(READER, "reader");
    expect(canCreateOwnAuthorProfile(reader, READER, false)).toBe(true);
    expect(canCreateOwnAuthorProfile(reader, READER, true)).toBe(false);
    expect(canCreateOwnAuthorProfile(reader, AUTHOR, false)).toBe(false);
  });

  it("allows authors to edit only their own profile", () => {
    const author = buildUser(AUTHOR, "author");
    expect(canCreateOwnAuthorProfile(author, AUTHOR, false)).toBe(true);
    expect(canEditAuthorProfile(author, AUTHOR)).toBe(true);
    expect(canEditAuthorProfile(author, READER)).toBe(false);
  });

  it("allows admins to edit any author profile", () => {
    const admin = buildUser(ADMIN, "admin");
    expect(canEditAuthorProfile(admin, AUTHOR)).toBe(true);
  });

  it("throws when admin access is denied", () => {
    const reader = buildUser(READER, "reader");
    expect(() => assertCanAccessAdmin(reader)).toThrow(WalletAuthorizationError);
  });
});
