import { describe, expect, it } from "vitest";
import { resolveAuthorIndexPage } from "./author-index";
import type { AuthorOnboardingSnapshot } from "./onboarding";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

function snapshot(
  overrides: Partial<AuthorOnboardingSnapshot> = {},
): AuthorOnboardingSnapshot {
  return {
    normalizedAddress: ADDRESS,
    isConnected: true,
    hasAuthorProfile: false,
    declinedAuthorPage: false,
    ...overrides,
  };
}

describe("resolveAuthorIndexPage", () => {
  it("asks to connect the wallet when snapshot is null", () => {
    expect(resolveAuthorIndexPage(null)).toEqual({ status: "connect_wallet" });
  });

  it("redirects to the author profile when one exists", () => {
    expect(
      resolveAuthorIndexPage(snapshot({ hasAuthorProfile: true })),
    ).toEqual({
      status: "redirect",
      path: `/author/${ADDRESS}`,
    });
  });

  it("shows onboarding when the wallet has no profile and has not declined", () => {
    expect(resolveAuthorIndexPage(snapshot())).toEqual({
      status: "onboarding",
    });
  });

  it("shows reader mode when the user declined author page creation", () => {
    expect(
      resolveAuthorIndexPage(snapshot({ declinedAuthorPage: true })),
    ).toEqual({ status: "reader_mode" });
  });
});
