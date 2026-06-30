import { describe, expect, it } from "vitest";
import {
  createAuthorBodySchema,
  updateAuthorActionSchema,
  walletPreferencesBodySchema,
} from "./schemas";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const SIGNATURE =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12";

const auth = {
  address: ADDRESS,
  message: "test message",
  signature: SIGNATURE,
};

describe("createAuthorBodySchema", () => {
  it("accepts valid payloads", () => {
    expect(
      createAuthorBodySchema.parse({
        ...auth,
        displayName: "Ada",
        avatarUrl: null,
        bio: "Writes speculative fiction.",
      }),
    ).toMatchObject({
      address: ADDRESS,
      displayName: "Ada",
      bio: "Writes speculative fiction.",
    });
  });

  it("normalizes blank bio to null", () => {
    expect(
      createAuthorBodySchema.parse({
        ...auth,
        bio: "   ",
      }).bio,
    ).toBeNull();
  });

  it("rejects unsafe bio characters", () => {
    expect(() =>
      createAuthorBodySchema.parse({
        ...auth,
        bio: "Hello\u0007",
      }),
    ).toThrow();
  });

  it("rejects empty display names", () => {
    expect(() =>
      createAuthorBodySchema.parse({ ...auth, displayName: "   " }),
    ).toThrow();
  });

  it("rejects unsupported avatar URLs", () => {
    expect(() =>
      createAuthorBodySchema.parse({
        ...auth,
        avatarUrl: "javascript:alert(1)",
      }),
    ).toThrow();
  });

  it("rejects oversized data URLs", () => {
    expect(() =>
      createAuthorBodySchema.parse({
        ...auth,
        avatarUrl: `data:image/png;base64,${"a".repeat(131_073)}`,
      }),
    ).toThrow();
  });
});

describe("updateAuthorActionSchema", () => {
  it("requires displayName and targetAddress", () => {
    expect(
      updateAuthorActionSchema.parse({
        ...auth,
        targetAddress: ADDRESS,
        displayName: "Updated",
        avatarUrl: null,
        bio: "Updated bio",
      }).bio,
    ).toBe("Updated bio");
  });
});

describe("walletPreferencesBodySchema", () => {
  it("accepts boolean preference", () => {
    expect(
      walletPreferencesBodySchema.parse({
        ...auth,
        declinedAuthorPage: true,
      }).declinedAuthorPage,
    ).toBe(true);
  });
});
