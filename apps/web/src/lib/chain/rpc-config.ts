import { getPublicChainName } from "@/lib/config/public-env";
import type { Chain } from "viem";
import { polygon, polygonAmoy } from "viem/chains";

import { AlchemyRpcUrlMissingError } from "./errors";

export function getTargetChain(): Chain {
  return getPublicChainName() === "polygon" ? polygon : polygonAmoy;
}

export function getServerAlchemyRpcUrl(): string {
  const url = process.env.ALCHEMY_RPC_URL?.trim();
  if (!url) {
    throw new AlchemyRpcUrlMissingError("server");
  }
  return url;
}

/** Returns the browser RPC URL when set; undefined allows wagmi to fall back to public RPC. */
export function getPublicAlchemyRpcUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL?.trim();
  return url || undefined;
}

export function requirePublicAlchemyRpcUrl(): string {
  const url = getPublicAlchemyRpcUrl();
  if (!url) {
    throw new AlchemyRpcUrlMissingError("client");
  }
  return url;
}
