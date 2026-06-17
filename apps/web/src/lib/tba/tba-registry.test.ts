import { getAddress } from "viem";
import { afterEach, describe, expect, it } from "vitest";

import {
  ERC6551_ACCOUNT_PROXY_ADDRESS,
  ERC6551_REGISTRY_ADDRESS,
  getErc6551ImplementationAddress,
  getErc6551RegistryAddress,
  getErc6551RegistryConfig,
  getTargetChainId,
} from "./tba-registry";

describe("tba-registry", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exposes canonical Tokenbound registry and proxy defaults", () => {
    expect(getErc6551RegistryAddress()).toBe(
      getAddress(ERC6551_REGISTRY_ADDRESS),
    );
    expect(getErc6551ImplementationAddress()).toBe(
      getAddress(ERC6551_ACCOUNT_PROXY_ADDRESS),
    );
  });

  it("reads registry and implementation overrides from public env", () => {
    process.env.NEXT_PUBLIC_ERC6551_REGISTRY =
      "0x0000000000000000000000000000000000000001";
    process.env.NEXT_PUBLIC_ERC6551_IMPLEMENTATION =
      "0x0000000000000000000000000000000000000002";

    expect(getErc6551RegistryAddress()).toBe(
      "0x0000000000000000000000000000000000000001",
    );
    expect(getErc6551ImplementationAddress()).toBe(
      "0x0000000000000000000000000000000000000002",
    );
  });

  it("builds registry config for the active public chain", () => {
    process.env.NEXT_PUBLIC_CHAIN = "amoy";
    const config = getErc6551RegistryConfig();

    expect(config.chainId).toBe(getTargetChainId());
    expect(config.registry).toBe(getErc6551RegistryAddress());
    expect(config.implementation).toBe(getErc6551ImplementationAddress());
  });
});
