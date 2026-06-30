import type { Address } from "viem";

import type { TbaPort } from "@/lib/tba/ports/tba-port";
import type { TbaDeployTransaction, TbaLookupParams } from "@/lib/tba/types";

export type TokenTbaLookupInput = {
  chainId: bigint | number;
  tokenContract: Address;
  tokenId: bigint;
};

export function buildTokenTbaLookup(
  input: TokenTbaLookupInput,
): TbaLookupParams {
  return {
    chainId: input.chainId,
    tokenContract: input.tokenContract,
    tokenId: input.tokenId,
  };
}

export type TbaDeploymentPlan = {
  address: Address;
  /** True when the TBA account already has bytecode on-chain. */
  alreadyDeployed: boolean;
  /** Transaction to submit when the account still needs deployment. */
  deployTransaction: TbaDeployTransaction | null;
};

/**
 * Resolves the deterministic TBA address for a minted token and decides whether
 * a `createAccount` transaction is still required (idempotent post-mint step).
 */
export async function planTokenTbaDeployment(
  tba: TbaPort,
  params: TbaLookupParams,
): Promise<TbaDeploymentPlan> {
  const address = await tba.getAddress(params);
  const alreadyDeployed = await tba.isDeployed(address);

  return {
    address,
    alreadyDeployed,
    deployTransaction: alreadyDeployed
      ? null
      : await tba.createDeployTransaction(params),
  };
}
