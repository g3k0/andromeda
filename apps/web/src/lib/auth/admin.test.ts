import { afterEach, describe, expect, it } from "vitest";
import {
  getAdminAddresses,
  isAdminAddress,
  parseAdminAddresses,
  setAdminAddressesForTests,
} from "./admin";

const ADMIN = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x1111111111111111111111111111111111111111";

describe("parseAdminAddresses", () => {
  it("parses comma-separated addresses in lowercase", () => {
    expect(
      parseAdminAddresses(` ${ADMIN.toUpperCase()} , ${OTHER} , , `),
    ).toEqual([ADMIN, OTHER]);
  });

  it("returns an empty array when input is missing", () => {
    expect(parseAdminAddresses(undefined)).toEqual([]);
  });
});

describe("isAdminAddress", () => {
  afterEach(() => {
    setAdminAddressesForTests(null);
  });

  it("returns true for addresses in the admin list", () => {
    setAdminAddressesForTests([ADMIN]);
    expect(isAdminAddress(ADMIN)).toBe(true);
    expect(isAdminAddress(ADMIN.toUpperCase())).toBe(true);
  });

  it("returns false for non-admin or invalid addresses", () => {
    setAdminAddressesForTests([ADMIN]);
    expect(isAdminAddress(OTHER)).toBe(false);
    expect(isAdminAddress(null)).toBe(false);
    expect(isAdminAddress("not-valid")).toBe(false);
  });

  it("accepts an explicit admin list override", () => {
    setAdminAddressesForTests([ADMIN]);
    expect(isAdminAddress(OTHER, [OTHER])).toBe(true);
  });

  it("reads from ADMIN_ADDRESSES when no override is set", () => {
    const previous = process.env.ADMIN_ADDRESSES;
    process.env.ADMIN_ADDRESSES = ADMIN;
    setAdminAddressesForTests(null);

    expect(getAdminAddresses()).toEqual([ADMIN]);
    expect(isAdminAddress(ADMIN)).toBe(true);

    process.env.ADMIN_ADDRESSES = previous;
  });
});
