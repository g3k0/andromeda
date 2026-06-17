import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  ERC6551_ACCOUNT_PROXY_ADDRESS,
  ERC6551_REGISTRY_ADDRESS,
} from "./tba-registry";
import { getTbaAddress } from "./tba-address";

/** Reference vector from ERC-6551 / RareSkills walkthrough (Sepolia). */
const REFERENCE_VECTOR = {
  registry: ERC6551_REGISTRY_ADDRESS,
  implementation: "0x311e822a099fae1ef8fc961ddf61fafd5392e7a9",
  chainId: 11_155_111n,
  tokenContract: "0x6b57b7edf751829dfb2aeccf578d6d24c33a45a2",
  tokenId: 1n,
  expected: "0x97212622cBdB6F1aa96C4abceAEbb2B1B47D2BBE",
} as const;

describe("getTbaAddress", () => {
  it("matches the known ERC-6551 reference vector", () => {
    expect(
      getTbaAddress({
        registry: REFERENCE_VECTOR.registry,
        implementation: REFERENCE_VECTOR.implementation,
        chainId: REFERENCE_VECTOR.chainId,
        tokenContract: REFERENCE_VECTOR.tokenContract,
        tokenId: REFERENCE_VECTOR.tokenId,
      }),
    ).toBe(getAddress(REFERENCE_VECTOR.expected));
  });

  it("changes when salt, chain, token, or implementation differ", () => {
    const base = {
      registry: ERC6551_REGISTRY_ADDRESS,
      implementation: ERC6551_ACCOUNT_PROXY_ADDRESS,
      chainId: 137n,
      tokenContract: "0xabcdef0123456789abcdef0123456789abcdef01" as const,
      tokenId: 42n,
    };

    const baseline = getTbaAddress(base);

    expect(
      getTbaAddress({
        ...base,
        tokenId: 43n,
      }),
    ).not.toBe(baseline);

    expect(
      getTbaAddress({
        ...base,
        chainId: 80_002n,
      }),
    ).not.toBe(baseline);

    expect(
      getTbaAddress({
        ...base,
        salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
      }),
    ).not.toBe(baseline);
  });
});
