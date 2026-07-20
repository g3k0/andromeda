import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { InvalidWorkIdError, TokenNotFoundError, WorkNotFoundError } from "../errors";
import {
  createInMemoryChainReader,
  createInMemoryChainState,
} from "./in-memory-chain-reader";

const AUTHOR = getAddress("0xabcdef0123456789abcdef0123456789abcdef01");
const OWNER = getAddress("0x1234567890abcdef1234567890abcdef12345678");

const SAMPLE_WORK = {
  workId: 1n,
  author: AUTHOR,
  metadataURI: "ipfs://bafywork",
  price: 100n,
  maxCopies: 5n,
  minted: 1n,
  primarySaleRemaining: 4n,
  active: true,
} as const;

describe("in-memory chain reader", () => {
  it("returns total works from seeded state", async () => {
    const reader = createInMemoryChainReader({
      totalWorks: 2n,
      works: [SAMPLE_WORK],
    });

    await expect(reader.getTotalWorks()).resolves.toBe(2n);
  });

  it("returns an existing work with normalized author address", async () => {
    const reader = createInMemoryChainReader({
      totalWorks: 1n,
      works: [
        {
          ...SAMPLE_WORK,
          author: AUTHOR.toLowerCase() as `0x${string}`,
        },
      ],
    });

    await expect(reader.getWork(1n)).resolves.toEqual({
      ...SAMPLE_WORK,
      author: AUTHOR,
    });
  });

  it("throws WorkNotFoundError when the work id is in range but missing", async () => {
    const reader = createInMemoryChainReader({
      totalWorks: 2n,
      works: [SAMPLE_WORK],
    });

    await expect(reader.getWork(2n)).rejects.toThrow(WorkNotFoundError);
  });

  it("throws InvalidWorkIdError when the work id is outside the registered range", async () => {
    const reader = createInMemoryChainReader({
      totalWorks: 1n,
      works: [SAMPLE_WORK],
    });

    await expect(reader.getWork(0n)).rejects.toThrow(InvalidWorkIdError);
    await expect(reader.getWork(2n)).rejects.toThrow(InvalidWorkIdError);
  });

  it("returns token ownership with normalized addresses", async () => {
    const reader = createInMemoryChainReader({
      totalWorks: 1n,
      works: [SAMPLE_WORK],
      tokens: [
        {
          tokenId: 42n,
          owner: OWNER.toLowerCase() as `0x${string}`,
          workId: 1n,
        },
      ],
    });

    await expect(reader.ownerOf(42n)).resolves.toEqual({
      tokenId: 42n,
      owner: OWNER,
    });
  });

  it("throws TokenNotFoundError for unknown tokens", async () => {
    const reader = createInMemoryChainReader({
      totalWorks: 1n,
      works: [SAMPLE_WORK],
    });

    await expect(reader.ownerOf(99n)).rejects.toThrow(TokenNotFoundError);
  });

  it("returns workOfToken and defaults to 0 when unmapped", async () => {
    const reader = createInMemoryChainReader({
      totalWorks: 1n,
      works: [SAMPLE_WORK],
      tokens: [{ tokenId: 7n, owner: OWNER, workId: 1n }],
    });

    await expect(reader.workOfToken(7n)).resolves.toBe(1n);
    await expect(reader.workOfToken(8n)).resolves.toBe(0n);
  });

  it("createInMemoryChainState builds maps from seed arrays", () => {
    const state = createInMemoryChainState({
      works: [SAMPLE_WORK],
      tokens: [{ tokenId: 1n, owner: OWNER, workId: 1n }],
    });

    expect(state.totalWorks).toBe(1n);
    expect(state.works.get(1n)).toEqual(SAMPLE_WORK);
    expect(state.tokens.get(1n)?.workId).toBe(1n);
  });
});
