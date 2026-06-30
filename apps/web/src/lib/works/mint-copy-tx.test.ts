import { parseEther } from "viem";
import { describe, expect, it } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import type { WorkOnChain } from "@/lib/chain/types";

import {
  buildMintCopyRequest,
  formatWorkPrice,
  getWorkAvailability,
} from "./mint-copy-tx";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;

function work(overrides: Partial<WorkOnChain>): WorkOnChain {
  return {
    workId: 1n,
    author: "0xabcdef0123456789abcdef0123456789abcdef01",
    metadataURI: "ipfs://meta",
    price: parseEther("0.05"),
    maxCopies: 100n,
    minted: 0n,
    active: true,
    ...overrides,
  };
}

describe("getWorkAvailability", () => {
  it("treats maxCopies 0 as an unlimited open sale", () => {
    expect(getWorkAvailability(work({ maxCopies: 0n, minted: 999n }))).toEqual({
      remaining: null,
      soldOut: false,
      saleOpen: true,
    });
  });

  it("computes remaining copies and keeps the sale open", () => {
    expect(getWorkAvailability(work({ maxCopies: 100n, minted: 40n }))).toEqual({
      remaining: 60n,
      soldOut: false,
      saleOpen: true,
    });
  });

  it("marks a fully minted work as sold out and closed", () => {
    expect(getWorkAvailability(work({ maxCopies: 100n, minted: 100n }))).toEqual({
      remaining: 0n,
      soldOut: true,
      saleOpen: false,
    });
  });

  it("keeps the sale closed when the work is inactive", () => {
    expect(getWorkAvailability(work({ active: false })).saleOpen).toBe(false);
  });
});

describe("formatWorkPrice", () => {
  it("formats wei into a POL label", () => {
    expect(formatWorkPrice(parseEther("0.05"))).toBe("0.05 POL");
    expect(formatWorkPrice(0n)).toBe("0 POL");
  });
});

describe("buildMintCopyRequest", () => {
  it("builds a payable mintCopy write request", () => {
    const request = buildMintCopyRequest({
      workId: 3n,
      priceWei: parseEther("0.05"),
      contractAddress: CONTRACT,
      abi: andromedaWorksAbi,
    });

    expect(request.functionName).toBe("mintCopy");
    expect(request.address).toBe(CONTRACT);
    expect(request.args).toEqual([3n]);
    expect(request.value).toBe(parseEther("0.05"));
  });
});
