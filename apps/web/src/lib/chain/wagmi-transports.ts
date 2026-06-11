import { http } from "viem";
import { polygon, polygonAmoy } from "viem/chains";

import { getPublicAlchemyRpcUrl } from "./rpc-config";

export function createWagmiTransports() {
  const alchemyUrl = getPublicAlchemyRpcUrl();

  return {
    [polygon.id]: http(alchemyUrl),
    [polygonAmoy.id]: http(alchemyUrl),
  };
}
