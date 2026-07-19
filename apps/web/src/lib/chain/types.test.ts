import { describe, expect, it } from "vitest";

import {
  InvalidWorkIdError,
  TokenNotFoundError,
  WorkNotFoundError,
} from "./errors";
import type { TokenOwner, WorkOnChain } from "./types";

describe("chain domain types", () => {
  it("accepts WorkOnChain and TokenOwner shapes", () => {
    const work: WorkOnChain = {
      workId: 1n,
      author: "0xabcdef0123456789abcdef0123456789abcdef01",
      metadataURI: "ipfs://bafywork",
      price: 100n,
      maxCopies: 10n,
      minted: 2n,
      primarySaleRemaining: 8n,
      active: true,
    };

    const tokenOwner: TokenOwner = {
      tokenId: 42n,
      owner: "0x1234567890abcdef1234567890abcdef12345678",
    };

    expect(work.workId).toBe(1n);
    expect(tokenOwner.tokenId).toBe(42n);
  });
});

describe("chain domain errors", () => {
  it("WorkNotFoundError includes work id", () => {
    const error = new WorkNotFoundError(7n);
    expect(error.name).toBe("WorkNotFoundError");
    expect(error.workId).toBe(7n);
    expect(error.message).toContain("7");
  });

  it("TokenNotFoundError includes token id", () => {
    const error = new TokenNotFoundError(99n);
    expect(error.name).toBe("TokenNotFoundError");
    expect(error.tokenId).toBe(99n);
    expect(error.message).toContain("99");
  });

  it("InvalidWorkIdError includes work id and total works", () => {
    const error = new InvalidWorkIdError(0n, 3n);
    expect(error.name).toBe("InvalidWorkIdError");
    expect(error.workId).toBe(0n);
    expect(error.totalWorks).toBe(3n);
    expect(error.message).toContain("0");
    expect(error.message).toContain("3");
  });
});
