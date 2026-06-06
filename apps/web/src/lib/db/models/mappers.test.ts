import { describe, expect, it } from "vitest";
import { toAuthorProfile, toWalletPreferences } from "./mappers";

describe("toAuthorProfile", () => {
  it("maps a mongoose-like document to the domain type", () => {
    const createdAt = new Date("2026-01-15T10:00:00.000Z");
    expect(
      toAuthorProfile({
        address: "0xabcdef0123456789abcdef0123456789abcdef01",
        displayName: "Ada",
        avatarUrl: null,
        createdAt,
      }),
    ).toEqual({
      address: "0xabcdef0123456789abcdef0123456789abcdef01",
      displayName: "Ada",
      avatarUrl: null,
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
