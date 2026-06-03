import { describe, expect, it } from "vitest";
import { defaultDisplayName, normalizeAddress } from "./address";

const VALID = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01";

describe("normalizeAddress", () => {
  it("returns lowercase address for valid input", () => {
    expect(normalizeAddress(VALID)).toBe(
      "0xabcdef0123456789abcdef0123456789abcdef01",
    );
  });

  it("trims whitespace", () => {
    expect(normalizeAddress(`  ${VALID}  `)).toBe(
      "0xabcdef0123456789abcdef0123456789abcdef01",
    );
  });

  it("returns null for invalid addresses", () => {
    expect(normalizeAddress("")).toBeNull();
    expect(normalizeAddress("0x1234")).toBeNull();
    expect(normalizeAddress("not-an-address")).toBeNull();
    expect(normalizeAddress(`${VALID}ff`)).toBeNull();
  });
});

describe("defaultDisplayName", () => {
  it("shortens the address for display", () => {
    const address = "0xabcdef0123456789abcdef0123456789abcdef01";
    expect(defaultDisplayName(address)).toBe("0xabcd…ef01");
  });
});
