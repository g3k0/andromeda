import type { useWriteContract } from "wagmi";

import type { wagmiConfig } from "@/lib/wagmi";

type WagmiConfig = typeof wagmiConfig;

export type ClientWriteContractAsync = ReturnType<
  typeof useWriteContract<WagmiConfig>
>["writeContractAsync"];
