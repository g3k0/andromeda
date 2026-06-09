import "server-only";

import { createMongoWalletSessionStore } from "./adapters/create-wallet-session-store";
import {
  createWalletSessionService,
  type WalletSessionService,
} from "./wallet-session";

let cachedService: WalletSessionService | null = null;

export async function getWalletSessionService(): Promise<WalletSessionService> {
  if (!cachedService) {
    const store = await createMongoWalletSessionStore();
    cachedService = createWalletSessionService(store);
  }
  return cachedService;
}

/** @internal Resets cached service between tests. */
export function resetWalletSessionServiceForTests(): void {
  cachedService = null;
}
