import type { PublicClient } from "viem";

import type { TbaPort } from "../ports/tba-port";
import {
  buildCreateAccountTransaction,
  resolveTbaAddress,
} from "../tba-operations";
import type { Erc6551RegistryConfig } from "../tba-registry";

export type ViemTbaOptions = {
  client: PublicClient;
  config: Erc6551RegistryConfig;
};

export function createViemTba({ client, config }: ViemTbaOptions): TbaPort {
  return {
    async getAddress(params) {
      return resolveTbaAddress(config, params);
    },

    async isDeployed(address) {
      const bytecode = await client.getBytecode({ address });
      return bytecode !== undefined && bytecode !== "0x" && bytecode.length > 2;
    },

    async createDeployTransaction(params) {
      return buildCreateAccountTransaction(config, params);
    },
  };
}
