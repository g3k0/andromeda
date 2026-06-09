import { describe, expect, it } from "vitest";
import { toAuthorOnboardingSnapshot } from "./onboarding-snapshot";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("toAuthorOnboardingSnapshot", () => {
  it("maps user snapshot fields used by onboarding", () => {
    expect(
      toAuthorOnboardingSnapshot({
        normalizedAddress: ADDRESS,
        isConnected: true,
        roleSlug: "reader",
        roleName: "Reader",
        status: "active",
        permissions: ["pages:read"],
        hasAuthorProfile: false,
        declinedAuthorPage: false,
      }),
    ).toEqual({
      normalizedAddress: ADDRESS,
      isConnected: true,
      hasAuthorProfile: false,
      declinedAuthorPage: false,
    });
  });
});
