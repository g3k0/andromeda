import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  assertValidWorkId,
  mapOwnerOf,
  mapRawWorkToWorkOnChain,
  normalizeAddress,
} from "./chain-reader";
import { InvalidWorkIdError } from "./errors";
import type { RawWorkTuple } from "./types";

const AUTHOR = getAddress("0xabcdef0123456789abcdef0123456789abcdef01");
const OWNER = getAddress("0x1234567890abcdef1234567890abcdef12345678");

describe("chain-reader pure helpers", () => {
  it("normalizes addresses to checksummed form", () => {
    expect(normalizeAddress(AUTHOR.toLowerCase())).toBe(AUTHOR);
    expect(normalizeAddress(OWNER.toLowerCase())).toBe(OWNER);
  });

  it("assertValidWorkId rejects ids outside the registered range", () => {
    expect(() => assertValidWorkId(0n, 2n)).toThrow(InvalidWorkIdError);
    expect(() => assertValidWorkId(3n, 2n)).toThrow(InvalidWorkIdError);
    expect(() => assertValidWorkId(1n, 2n)).not.toThrow();
  });

  it("maps raw contract tuples to WorkOnChain", () => {
    const raw: RawWorkTuple = [
      AUTHOR.toLowerCase() as `0x${string}`,
      "ipfs://bafywork",
      250n,
      5n,
      1n,
      true,
    ];

    expect(mapRawWorkToWorkOnChain(1n, raw, 3n)).toEqual({
      workId: 1n,
      author: AUTHOR,
      metadataURI: "ipfs://bafywork",
      price: 250n,
      maxCopies: 5n,
      minted: 1n,
      primarySaleRemaining: 3n,
      active: true,
    });
  });

  it("maps ownerOf responses to TokenOwner", () => {
    expect(mapOwnerOf(42n, OWNER.toLowerCase())).toEqual({
      tokenId: 42n,
      owner: OWNER,
    });
  });
});
