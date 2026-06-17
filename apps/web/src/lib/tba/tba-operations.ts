import { encodeFunctionData, getAddress, type Address } from "viem";

import type { ChainReader } from "@/lib/chain/ports/chain-reader-port";

import { DEFAULT_TBA_SALT, getTbaAddress } from "./tba-address";
import { erc6551RegistryAbi } from "./erc6551-registry-abi";
import { TbaNotTokenOwnerError } from "./errors";
import type { Erc6551RegistryConfig } from "./tba-registry";
import type { TbaDeployTransaction, TbaLookupParams } from "./types";

export function normalizeWalletAddress(address: string): Address {
  return getAddress(address);
}

export function walletControlsToken(
  tokenOwner: Address,
  walletAddress: string,
): boolean {
  return (
    normalizeWalletAddress(tokenOwner) === normalizeWalletAddress(walletAddress)
  );
}

export async function assertWalletControlsToken(
  chainReader: ChainReader,
  tokenId: bigint,
  walletAddress: string,
): Promise<void> {
  const { owner } = await chainReader.ownerOf(tokenId);
  const wallet = normalizeWalletAddress(walletAddress);

  if (owner !== wallet) {
    throw new TbaNotTokenOwnerError(tokenId, wallet);
  }
}

export function resolveTbaAddress(
  config: Erc6551RegistryConfig,
  params: TbaLookupParams,
): Address {
  return getTbaAddress({
    registry: config.registry,
    implementation: config.implementation,
    chainId: params.chainId,
    tokenContract: params.tokenContract,
    tokenId: params.tokenId,
    salt: params.salt,
  });
}

export function buildCreateAccountTransaction(
  config: Erc6551RegistryConfig,
  params: TbaLookupParams,
): TbaDeployTransaction {
  const salt = params.salt ?? DEFAULT_TBA_SALT;

  return {
    to: config.registry,
    data: encodeFunctionData({
      abi: erc6551RegistryAbi,
      functionName: "createAccount",
      args: [
        config.implementation,
        salt,
        BigInt(params.chainId),
        getAddress(params.tokenContract),
        params.tokenId,
      ],
    }),
    value: 0n,
  };
}
