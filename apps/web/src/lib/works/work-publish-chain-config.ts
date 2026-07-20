import { getContractAddress } from "@/lib/config/public-env";
import {
  getErc6551RegistryAddress,
  getTargetChainId,
} from "@/lib/tba/tba-registry";
import type { Address } from "viem";

import { WorkUploadValidationError } from "./errors";

export type WorkPublishChainConfig = {
  contractAddress: `0x${string}`;
  registryAddress: Address;
  chainId: number;
};

const CONTRACT_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export function resolveWorkPublishChainConfig(): WorkPublishChainConfig {
  const contractAddress = getContractAddress().trim();
  if (!CONTRACT_ADDRESS_PATTERN.test(contractAddress)) {
    throw new WorkUploadValidationError(
      "Publishing is unavailable: NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.",
    );
  }

  return {
    contractAddress: contractAddress as `0x${string}`,
    registryAddress: getErc6551RegistryAddress(),
    chainId: getTargetChainId(),
  };
}
