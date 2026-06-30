import { describe, expect, it } from "vitest";
import { toAuthorProfile, toUser, toWalletPreferences } from "./mappers";

describe("toAuthorProfile", () => {
  it("maps a mongoose-like document to the domain type", () => {
    const createdAt = new Date("2026-01-15T10:00:00.000Z");
    expect(
      toAuthorProfile({
        address: "0xabcdef0123456789abcdef0123456789abcdef01",
        displayName: "Ada",
        avatarUrl: null,
        bio: "Public bio",
        createdAt,
      }),
    ).toEqual({
      address: "0xabcdef0123456789abcdef0123456789abcdef01",
      displayName: "Ada",
      avatarUrl: null,
      bio: "Public bio",
      createdAt: createdAt.toISOString(),
    });
  });
});

describe("toWalletPreferences", () => {
  it("maps wallet preference fields", () => {
    expect(
      toWalletPreferences({
        address: "0xabcdef0123456789abcdef0123456789abcdef01",
        declinedAuthorPage: true,
      }),
    ).toEqual({ declinedAuthorPage: true });
  });
});

describe("toUser", () => {
  it("maps a mongoose-like user document to the domain type", () => {
    const createdAt = new Date("2026-01-15T10:00:00.000Z");
    const updatedAt = new Date("2026-01-16T12:00:00.000Z");
    const onboardingCompletedAt = new Date("2026-01-15T11:00:00.000Z");

    expect(
      toUser({
        address: "0xabcdef0123456789abcdef0123456789abcdef01",
        roleSlug: "author",
        status: "active",
        permissionOverrides: ["pages:read", "invalid:permission"],
        preferences: {
          declinedAuthorPage: true,
          onboardingCompletedAt,
        },
        metadata: { locale: "it" },
        createdAt,
        updatedAt,
      }),
    ).toEqual({
      address: "0xabcdef0123456789abcdef0123456789abcdef01",
      roleSlug: "author",
      status: "active",
      permissionOverrides: ["pages:read"],
      preferences: {
        declinedAuthorPage: true,
        onboardingCompletedAt: onboardingCompletedAt.toISOString(),
      },
      metadata: { locale: "it" },
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it("falls back to legacy role and permissions fields", () => {
    const createdAt = new Date("2026-01-15T10:00:00.000Z");
    const updatedAt = new Date("2026-01-16T12:00:00.000Z");

    expect(
      toUser({
        address: "0xabcdef0123456789abcdef0123456789abcdef01",
        role: "reader",
        permissions: ["admin:access"],
        status: "active",
        createdAt,
        updatedAt,
      }),
    ).toMatchObject({
      roleSlug: "reader",
      permissionOverrides: ["admin:access"],
    });
  });
});
