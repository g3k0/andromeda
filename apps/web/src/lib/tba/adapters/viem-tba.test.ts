import { getAddress, type PublicClient } from "viem";
import { describe, expect, it, vi } from "vitest";

import { createViemTba } from "../adapters/viem-tba";
import {
  ERC6551_ACCOUNT_PROXY_ADDRESS,
  ERC6551_REGISTRY_ADDRESS,
} from "../tba-registry";
import {
  createInMemoryTba,
  markTbaDeployed,
} from "../testing/in-memory-tba";

const TOKEN_CONTRACT = getAddress(
  "0x00000000000000000000000000000000000000c8",
);

const CONFIG = {
  registry: ERC6551_REGISTRY_ADDRESS,
  implementation: ERC6551_ACCOUNT_PROXY_ADDRESS,
  chainId: 137,
} as const;

function createMockClient(
  getBytecode: ReturnType<typeof vi.fn>,
): PublicClient {
  return { getBytecode } as unknown as PublicClient;
}

describe("createViemTba", () => {
  it("computes deterministic addresses from lookup params", async () => {
    const tba = createViemTba({
      client: createMockClient(vi.fn()),
      config: CONFIG,
    });

    const address = await tba.getAddress({
      chainId: 137,
      tokenContract: TOKEN_CONTRACT,
      tokenId: 1n,
    });

    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("detects deployed accounts via bytecode", async () => {
    const getBytecode = vi
      .fn()
      .mockResolvedValueOnce("0x")
      .mockResolvedValueOnce("0x1234");
    const tba = createViemTba({
      client: createMockClient(getBytecode),
      config: CONFIG,
    });
    const address = getAddress("0x0000000000000000000000000000000000000001");

    await expect(tba.isDeployed(address)).resolves.toBe(false);
    await expect(tba.isDeployed(address)).resolves.toBe(true);
  });

  it("builds createAccount deploy transactions", async () => {
    const tba = createViemTba({
      client: createMockClient(vi.fn()),
      config: CONFIG,
    });

    const tx = await tba.createDeployTransaction({
      chainId: 137,
      tokenContract: TOKEN_CONTRACT,
      tokenId: 42n,
    });

    expect(tx.to).toBe(CONFIG.registry);
    expect(tx.value).toBe(0n);
    expect(tx.data.startsWith("0x")).toBe(true);
  });
});

describe("createInMemoryTba", () => {
  it("tracks deployed TBAs in memory", async () => {
    const state = {
      config: CONFIG,
      deployed: new Set<`0x${string}`>(),
    };
    const tba = createInMemoryTba(state);
    const address = await tba.getAddress({
      chainId: 137,
      tokenContract: TOKEN_CONTRACT,
      tokenId: 9n,
    });

    await expect(tba.isDeployed(address)).resolves.toBe(false);
    markTbaDeployed(state, address);
    await expect(tba.isDeployed(address)).resolves.toBe(true);
  });

  it("seeds deployed addresses from lookup params", async () => {
    const tba = createInMemoryTba({
      config: CONFIG,
      deployed: [],
    });
    const address = await tba.getAddress({
      chainId: 137,
      tokenContract: TOKEN_CONTRACT,
      tokenId: 2n,
    });

    await expect(tba.isDeployed(address)).resolves.toBe(false);
  });
});
