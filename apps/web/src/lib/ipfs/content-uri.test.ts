import { describe, expect, it } from "vitest";

import {
  isArweaveUri,
  isContentUri,
  isIpfsUri,
  parseArweaveUri,
  parseContentLocator,
  toArweaveUri,
} from "./content-uri";

describe("content-uri", () => {
  it("detects ar:// and ipfs:// schemes", () => {
    expect(isArweaveUri("ar://abc123")).toBe(true);
    expect(isIpfsUri("ipfs://bafybeiabc")).toBe(true);
    expect(isContentUri("ar://abc123")).toBe(true);
    expect(isContentUri("ipfs://bafybeiabc")).toBe(true);
    expect(isContentUri("https://example.test")).toBe(false);
  });

  it("builds and parses ar:// URIs", () => {
    expect(toArweaveUri("TxId123")).toBe("ar://TxId123");
    expect(toArweaveUri("ar://TxId123")).toBe("ar://TxId123");
    expect(parseArweaveUri("ar://TxId123")).toBe("TxId123");
  });

  it("rejects empty or non-arweave values", () => {
    expect(() => toArweaveUri("")).toThrow(/non-empty/);
    expect(() => parseArweaveUri("ipfs://bafy")).toThrow(/ar:\/\//);
    expect(() => parseArweaveUri("ar://")).toThrow(/transaction id/);
  });

  it("parses content locators for both schemes and raw ids", () => {
    expect(parseContentLocator("ar://TxId123")).toEqual({
      scheme: "ar",
      id: "TxId123",
    });
    expect(parseContentLocator("ipfs://bafybeiabc")).toEqual({
      scheme: "ipfs",
      id: "bafybeiabc",
    });
    expect(parseContentLocator("bafybeiabc")).toEqual({
      scheme: "raw",
      id: "bafybeiabc",
    });
  });
});
