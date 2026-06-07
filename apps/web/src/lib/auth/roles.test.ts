import { describe, expect, it } from "vitest";
import {
  canEditAuthorPage,
  getUserRole,
  resolveCanEditAuthorPageFromRole,
} from "./roles";

const VIEWER = "0xabcdef0123456789abcdef0123456789abcdef01";
const OWNER = "0x1111111111111111111111111111111111111111";

describe("getUserRole", () => {
  it("returns admin when connected wallet is admin", () => {
    expect(
      getUserRole({
        address: VIEWER,
        isConnected: true,
        hasAuthorProfile: false,
        isAdmin: true,
      }),
    ).toBe("admin");
  });

  it("returns admin even without an author profile", () => {
    expect(
      getUserRole({
        address: VIEWER,
        isConnected: true,
        hasAuthorProfile: false,
        isAdmin: true,
      }),
    ).toBe("admin");
  });

  it("returns author when connected with a profile and not admin", () => {
    expect(
      getUserRole({
        address: VIEWER,
        isConnected: true,
        hasAuthorProfile: true,
        isAdmin: false,
      }),
    ).toBe("author");
  });

  it("returns reader when connected without a profile", () => {
    expect(
      getUserRole({
        address: VIEWER,
        isConnected: true,
        hasAuthorProfile: false,
        isAdmin: false,
      }),
    ).toBe("reader");
  });

  it("returns reader when wallet is not connected", () => {
    expect(
      getUserRole({
        address: null,
        isConnected: false,
        hasAuthorProfile: false,
        isAdmin: false,
      }),
    ).toBe("reader");
  });

  it("returns reader when admin flag is set but wallet is disconnected", () => {
    expect(
      getUserRole({
        address: VIEWER,
        isConnected: false,
        hasAuthorProfile: true,
        isAdmin: true,
      }),
    ).toBe("reader");
  });

  it("returns reader when connected but address is missing", () => {
    expect(
      getUserRole({
        address: undefined,
        isConnected: true,
        hasAuthorProfile: true,
        isAdmin: false,
      }),
    ).toBe("reader");
  });

  it("prefers persisted userRole over derived flags", () => {
    expect(
      getUserRole({
        address: VIEWER,
        isConnected: true,
        hasAuthorProfile: false,
        isAdmin: false,
        userRole: "admin",
      }),
    ).toBe("admin");
  });

  it("prefers admin over author when both apply", () => {
    expect(
      getUserRole({
        address: VIEWER,
        isConnected: true,
        hasAuthorProfile: true,
        isAdmin: true,
      }),
    ).toBe("admin");
  });
});

describe("canEditAuthorPage", () => {
  it("allows admins to edit any profile", () => {
    expect(canEditAuthorPage(null, OWNER, true)).toBe(true);
    expect(canEditAuthorPage(VIEWER, OWNER, true)).toBe(true);
  });

  it("allows the profile owner to edit their page", () => {
    expect(canEditAuthorPage(VIEWER, VIEWER, false)).toBe(true);
    expect(canEditAuthorPage(VIEWER.toUpperCase(), VIEWER, false)).toBe(true);
  });

  it("denies edit for other connected wallets", () => {
    expect(canEditAuthorPage(VIEWER, OWNER, false)).toBe(false);
  });

  it("denies edit when viewer address is missing or invalid", () => {
    expect(canEditAuthorPage(null, OWNER, false)).toBe(false);
    expect(canEditAuthorPage("bad", OWNER, false)).toBe(false);
  });

  it("denies edit when profile owner address is invalid", () => {
    expect(canEditAuthorPage(VIEWER, "bad", false)).toBe(false);
  });
});

describe("resolveCanEditAuthorPageFromRole", () => {
  it("allows admins to edit any profile", () => {
    expect(
      resolveCanEditAuthorPageFromRole("admin", VIEWER, OWNER),
    ).toBe(true);
  });

  it("allows authors to edit only their own profile", () => {
    expect(
      resolveCanEditAuthorPageFromRole("author", VIEWER, VIEWER),
    ).toBe(true);
    expect(
      resolveCanEditAuthorPageFromRole("author", VIEWER, OWNER),
    ).toBe(false);
  });

  it("denies readers from editing", () => {
    expect(
      resolveCanEditAuthorPageFromRole("reader", VIEWER, VIEWER),
    ).toBe(false);
  });
});
