import { getAddress, type PublicClient } from "viem";
import { describe, expect, it, vi } from "vitest";

import { createViemChainReader } from "./viem-chain-reader";
import { InvalidWorkIdError, TokenNotFoundError } from "../errors";

const CONTRACT = getAddress("0x0000000000000000000000000000000000000001");
const AUTHOR = getAddress("0xabcdef0123456789abcdef0123456789abcdef01");
const OWNER = getAddress("0x1234567890abcdef1234567890abcdef12345678");

function createMockClient(
  readContract: ReturnType<typeof vi.fn>,
): PublicClient {
  return { readContract } as unknown as PublicClient;
}

describe("createViemChainReader", () => {
  it("reads totalWorks from the contract", async () => {
    const readContract = vi.fn().mockResolvedValueOnce(2n);
    const reader = createViemChainReader({
      client: createMockClient(readContract),
      contractAddress: CONTRACT,
    });

    await expect(reader.getTotalWorks()).resolves.toBe(2n);
    expect(readContract).toHaveBeenCalledWith({
      address: CONTRACT,
      abi: expect.any(Array),
      functionName: "totalWorks",
    });
  });

  it("reads and maps a work by id", async () => {
    const readContract = vi
      .fn()
      .mockResolvedValueOnce(1n)
      .mockResolvedValueOnce([
        AUTHOR,
        "ipfs://bafywork",
        100n,
        0n,
        3n,
        true,
      ] as const)
      .mockResolvedValueOnce(7n);

    const reader = createViemChainReader({
      client: createMockClient(readContract),
      contractAddress: CONTRACT,
    });

    await expect(reader.getWork(1n)).resolves.toEqual({
      workId: 1n,
      author: AUTHOR,
      metadataURI: "ipfs://bafywork",
      price: 100n,
      maxCopies: 0n,
      minted: 3n,
      primarySaleRemaining: 7n,
      active: true,
    });
  });

  it("rejects invalid work ids before calling works()", async () => {
    const readContract = vi.fn().mockResolvedValueOnce(1n);
    const reader = createViemChainReader({
      client: createMockClient(readContract),
      contractAddress: CONTRACT,
    });

    await expect(reader.getWork(2n)).rejects.toThrow(InvalidWorkIdError);
    expect(readContract).toHaveBeenCalledTimes(1);
  });

  it("reads ownerOf and normalizes the address", async () => {
    const readContract = vi.fn().mockResolvedValueOnce(OWNER.toLowerCase());
    const reader = createViemChainReader({
      client: createMockClient(readContract),
      contractAddress: CONTRACT,
    });

    await expect(reader.ownerOf(7n)).resolves.toEqual({
      tokenId: 7n,
      owner: OWNER,
    });
  });

  it("maps ownerOf reverts to TokenNotFoundError", async () => {
    const readContract = vi.fn().mockRejectedValueOnce(new Error("reverted"));
    const reader = createViemChainReader({
      client: createMockClient(readContract),
      contractAddress: CONTRACT,
    });

    await expect(reader.ownerOf(99n)).rejects.toThrow(TokenNotFoundError);
  });

  it("reads workOfToken from the contract", async () => {
    const readContract = vi.fn().mockResolvedValueOnce(4n);
    const reader = createViemChainReader({
      client: createMockClient(readContract),
      contractAddress: CONTRACT,
    });

    await expect(reader.workOfToken(7n)).resolves.toBe(4n);
    expect(readContract).toHaveBeenCalledWith({
      address: CONTRACT,
      abi: expect.any(Array),
      functionName: "workOfToken",
      args: [7n],
    });
  });
});
