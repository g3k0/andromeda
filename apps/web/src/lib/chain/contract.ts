import type { Abi } from "viem";

import { getContractAddress as getContractAddressFromEnv } from "@/lib/config/public-env";

import andromedaWorksAbiJson from "./andromeda-works.abi.json";

export const andromedaWorksAbi = andromedaWorksAbiJson as Abi;

/** @deprecated Use `andromedaWorksAbi` instead. */
export const andromedaAbi = andromedaWorksAbi;

export function getContractAddress(): `0x${string}` {
  return getContractAddressFromEnv();
}

export const contractAddress = getContractAddress();
