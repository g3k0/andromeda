import { describe, expect, it } from "vitest";
import { resolveAuthorOnboardingDialogState } from "./author-onboarding-dialog-state";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author onboarding dialog state", () => {
  it("keeps the dialog closed when disconnected", () => {
    expect(resolveAuthorOnboardingDialogState(undefined, false, null)).toEqual({
      open: false,
      canInteract: false,
    });
  });

  it("opens the dialog for a connected wallet without a profile", () => {
    expect(
      resolveAuthorOnboardingDialogState(ADDRESS, true, {
        normalizedAddress: ADDRESS,
        isConnected: true,
        hasAuthorProfile: false,
        declinedAuthorPage: false,
      }),
    ).toEqual({
      open: true,
      canInteract: true,
    });
  });

  it("stays closed when the user already has an author profile", () => {
    expect(
      resolveAuthorOnboardingDialogState(ADDRESS, true, {
        normalizedAddress: ADDRESS,
        isConnected: true,
        hasAuthorProfile: true,
        declinedAuthorPage: false,
      }),
    ).toEqual({
      open: false,
      canInteract: true,
    });
  });

  it("stays closed when the user already declined", () => {
    expect(
      resolveAuthorOnboardingDialogState(ADDRESS, true, {
        normalizedAddress: ADDRESS,
        isConnected: true,
        hasAuthorProfile: false,
        declinedAuthorPage: true,
      }),
    ).toEqual({
      open: false,
      canInteract: true,
    });
  });
});
