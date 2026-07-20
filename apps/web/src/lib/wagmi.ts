import { getWalletConnectProjectId } from "@/lib/config/public-env";
import { createWagmiTransports } from "@/lib/chain/wagmi-transports";
import { getTargetChain } from "@/lib/chain/rpc-config";
import { injected, walletConnect } from "@/lib/wagmi-connectors";
import { createConfig } from "wagmi";

const projectId = getWalletConnectProjectId();

export const targetChain = getTargetChain();

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: createWagmiTransports(),
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
