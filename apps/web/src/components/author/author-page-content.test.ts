import { describe, expect, it } from "vitest";
import {
  isAdminEditingOtherAuthorPage,
  resolveCanEditAuthorPage,
} from "./author-page-content";

const OWNER = "0xabcdef0123456789abcdef0123456789abcdef01";
const ADMIN = "0x1111111111111111111111111111111111111111";
const READER = "0x2222222222222222222222222222222222222222";

describe("resolveCanEditAuthorPage", () => {
  it("allows the profile owner to edit", () => {
    expect(
      resolveCanEditAuthorPage({
        viewerAddress: OWNER,
        isConnected: true,
        isAdmin: false,
        profileOwnerAddress: OWNER,
      }),
    ).toBe(true);
  });

  it("allows admins to edit any profile", () => {
    expect(
      resolveCanEditAuthorPage({
        viewerAddress: ADMIN,
        isConnected: true,
        isAdmin: true,
        profileOwnerAddress: OWNER,
      }),
    ).toBe(true);
  });

  it("denies edit for other readers", () => {
    expect(
      resolveCanEditAuthorPage({
        viewerAddress: READER,
        isConnected: true,
        isAdmin: false,
        profileOwnerAddress: OWNER,
      }),
    ).toBe(false);
  });

  it("denies edit when wallet is disconnected", () => {
    expect(
      resolveCanEditAuthorPage({
        viewerAddress: OWNER,
        isConnected: false,
        isAdmin: false,
        profileOwnerAddress: OWNER,
      }),
    ).toBe(false);
  });
});

describe("isAdminEditingOtherAuthorPage", () => {
  it("returns true when admin edits another author", () => {
    expect(
      isAdminEditingOtherAuthorPage({
        viewerAddress: ADMIN,
        isAdmin: true,
        profileOwnerAddress: OWNER,
      }),
    ).toBe(true);
  });

  it("returns false when admin edits their own profile", () => {
    expect(
      isAdminEditingOtherAuthorPage({
        viewerAddress: ADMIN,
        isAdmin: true,
        profileOwnerAddress: ADMIN,
      }),
    ).toBe(false);
  });

  it("returns false for non-admin viewers", () => {
    expect(
      isAdminEditingOtherAuthorPage({
        viewerAddress: OWNER,
        isAdmin: false,
        profileOwnerAddress: OWNER,
      }),
    ).toBe(false);
  });
});
