import type { Address } from "viem";

import type { TbaDeployTransaction, TbaLookupParams } from "../types";

export type TbaPort = {
  getAddress(params: TbaLookupParams): Promise<Address>;
  isDeployed(address: Address): Promise<boolean>;
  createDeployTransaction(
    params: TbaLookupParams,
  ): Promise<TbaDeployTransaction>;
};
