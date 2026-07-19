import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { createInMemoryChainReader } from "@/lib/chain/testing/in-memory-chain-reader";

import { TbaNotTokenOwnerError } from "./errors";
import {
  assertWalletControlsToken,
  buildCreateAccountTransaction,
  resolveTbaAddress,
  walletControlsToken,
} from "./tba-operations";
import {
  ERC6551_ACCOUNT_PROXY_ADDRESS,
  ERC6551_REGISTRY_ADDRESS,
} from "./tba-registry";

const OWNER = getAddress("0xabcdef0123456789abcdef0123456789abcdef01");
const OTHER = getAddress("0x1234567890abcdef1234567890abcdef12345678");
const TOKEN_CONTRACT = getAddress(
  "0x00000000000000000000000000000000000000c8",
);

describe("tba-operations", () => {
  it("walletControlsToken compares checksummed addresses", () => {
    expect(walletControlsToken(OWNER, OWNER.toLowerCase())).toBe(true);
    expect(walletControlsToken(OWNER, OTHER)).toBe(false);
  });

  it("assertWalletControlsToken passes for the current token owner", async () => {
    const chainReader = createInMemoryChainReader({
      totalWorks: 1n,
      works: [
        {
          workId: 1n,
          author: OWNER,
          metadataURI: "ipfs://bafy",
          price: 0n,
          maxCopies: 0n,
          minted: 1n,
          primarySaleRemaining: 0n,
          active: true,
        },
      ],
      tokens: [{ tokenId: 7n, owner: OWNER, workId: 1n }],
    });

    await expect(
      assertWalletControlsToken(chainReader, 7n, OWNER.toLowerCase()),
    ).resolves.toBeUndefined();
  });

  it("assertWalletControlsToken rejects wallets that do not own the token", async () => {
    const chainReader = createInMemoryChainReader({
      totalWorks: 1n,
      works: [
        {
          workId: 1n,
          author: OWNER,
          metadataURI: "ipfs://bafy",
          price: 0n,
          maxCopies: 0n,
          minted: 1n,
          primarySaleRemaining: 0n,
          active: true,
        },
      ],
      tokens: [{ tokenId: 7n, owner: OWNER, workId: 1n }],
    });

    await expect(
      assertWalletControlsToken(chainReader, 7n, OTHER),
    ).rejects.toThrow(TbaNotTokenOwnerError);
  });

  it("resolveTbaAddress uses registry config and lookup params", () => {
    const address = resolveTbaAddress(
      {
        registry: ERC6551_REGISTRY_ADDRESS,
        implementation: ERC6551_ACCOUNT_PROXY_ADDRESS,
        chainId: 137,
      },
      {
        chainId: 137,
        tokenContract: TOKEN_CONTRACT,
        tokenId: 300n,
      },
    );

    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("buildCreateAccountTransaction encodes registry.createAccount", () => {
    const tx = buildCreateAccountTransaction(
      {
        registry: ERC6551_REGISTRY_ADDRESS,
        implementation: ERC6551_ACCOUNT_PROXY_ADDRESS,
        chainId: 137,
      },
      {
        chainId: 137,
        tokenContract: TOKEN_CONTRACT,
        tokenId: 300n,
      },
    );

    expect(tx.to).toBe(ERC6551_REGISTRY_ADDRESS);
    expect(tx.value).toBe(0n);
    expect(tx.data.startsWith("0x")).toBe(true);
    expect(tx.data.length).toBeGreaterThan(10);
  });
});
