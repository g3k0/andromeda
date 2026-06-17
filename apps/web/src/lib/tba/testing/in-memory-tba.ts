import { getAddress, type Address } from "viem";

import type { TbaPort } from "../ports/tba-port";
import {
  buildCreateAccountTransaction,
  resolveTbaAddress,
} from "../tba-operations";
import type { Erc6551RegistryConfig } from "../tba-registry";
import type { TbaLookupParams } from "../types";

export type InMemoryTbaSeed = {
  config: Erc6551RegistryConfig;
  deployed?: readonly Address[];
};

export type InMemoryTbaState = {
  config: Erc6551RegistryConfig;
  deployed: Set<Address>;
};

export function createInMemoryTbaState(
  seed: InMemoryTbaSeed,
): InMemoryTbaState {
  return {
    config: seed.config,
    deployed: new Set((seed.deployed ?? []).map((address) => getAddress(address))),
  };
}

export function markTbaDeployed(
  state: InMemoryTbaState,
  address: Address,
): void {
  state.deployed.add(getAddress(address));
}

function isInMemoryTbaState(
  seed: InMemoryTbaSeed | InMemoryTbaState,
): seed is InMemoryTbaState {
  return seed.deployed instanceof Set;
}

export function createInMemoryTba(
  seed: InMemoryTbaSeed | InMemoryTbaState,
): TbaPort {
  const state = isInMemoryTbaState(seed)
    ? seed
    : createInMemoryTbaState(seed);

  return {
    async getAddress(params: TbaLookupParams) {
      return resolveTbaAddress(state.config, params);
    },

    async isDeployed(address: Address) {
      return state.deployed.has(getAddress(address));
    },

    async createDeployTransaction(params: TbaLookupParams) {
      return buildCreateAccountTransaction(state.config, params);
    },
  };
}
