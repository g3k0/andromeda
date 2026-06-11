import "server-only";

import { createPublicClient, http, type PublicClient } from "viem";

import { getServerAlchemyRpcUrl, getTargetChain } from "./rpc-config";

export function createAndromedaPublicClient(): PublicClient {
  return createPublicClient({
    chain: getTargetChain(),
    transport: http(getServerAlchemyRpcUrl()),
  });
}
