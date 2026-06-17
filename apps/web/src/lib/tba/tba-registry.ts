import { getAddress, type Address } from "viem";
import { polygon, polygonAmoy } from "viem/chains";

import { getPublicChainName } from "@/lib/config/public-env";

/** Canonical ERC-6551 registry (Tokenbound / reference v0.3.1). */
export const ERC6551_REGISTRY_ADDRESS =
  "0x000000006551c19487814612e58FE06813775758" as const;

/**
 * Tokenbound account proxy — pass as `implementation` to `registry.createAccount`.
 * @see https://docs.tokenbound.org/contracts/deployments
 */
export const ERC6551_ACCOUNT_PROXY_ADDRESS =
  "0x55266d75D1a14E4572138116aF39863Ed6596E7F" as const;

/** Upgradeable account logic initialized on newly created TBAs. */
export const ERC6551_ACCOUNT_IMPLEMENTATION_ADDRESS =
  "0x41C8f39463A868d3A88af00cd0fe7102F30E44eC" as const;

export type Erc6551RegistryConfig = {
  registry: Address;
  implementation: Address;
  chainId: number;
};

export function getErc6551RegistryAddress(): Address {
  const fromEnv = process.env.NEXT_PUBLIC_ERC6551_REGISTRY?.trim();
  if (fromEnv) {
    return getAddress(fromEnv);
  }
  return ERC6551_REGISTRY_ADDRESS;
}

export function getErc6551ImplementationAddress(): Address {
  const fromEnv = process.env.NEXT_PUBLIC_ERC6551_IMPLEMENTATION?.trim();
  if (fromEnv) {
    return getAddress(fromEnv);
  }
  return ERC6551_ACCOUNT_PROXY_ADDRESS;
}

export function getTargetChainId(): number {
  return getPublicChainName() === "polygon" ? polygon.id : polygonAmoy.id;
}

export function getErc6551RegistryConfig(
  chainId: number = getTargetChainId(),
): Erc6551RegistryConfig {
  return {
    registry: getErc6551RegistryAddress(),
    implementation: getErc6551ImplementationAddress(),
    chainId,
  };
}
