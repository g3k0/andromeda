import {
  getPublicChainName,
  getWalletConnectProjectId,
} from "@/lib/config/public-env";
import { http, createConfig } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = getWalletConnectProjectId();

export const targetChain =
  getPublicChainName() === "polygon" ? polygon : polygonAmoy;

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
