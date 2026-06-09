import "server-only";

import { createMongoWalletAuthNonceStore } from "./adapters/create-wallet-auth-nonce-store";
import type { WalletAuthNonceStore } from "./wallet-auth-nonce-store";
import { InMemoryWalletAuthNonceStore } from "./testing/in-memory-wallet-auth-nonce-store";

let cachedStore: WalletAuthNonceStore | null = null;
let testStore: WalletAuthNonceStore | null = null;

function shouldUseInMemoryStore(): boolean {
  return process.env.VITEST === "true" && !process.env.MONGODB_URI;
}

export async function getWalletAuthNonceStore(): Promise<WalletAuthNonceStore> {
  if (testStore) {
    return testStore;
  }

  if (shouldUseInMemoryStore()) {
    testStore = new InMemoryWalletAuthNonceStore();
    return testStore;
  }

  if (!cachedStore) {
    cachedStore = await createMongoWalletAuthNonceStore();
  }

  return cachedStore;
}

/** @internal Uses in-memory store for unit tests. */
export function useInMemoryWalletAuthNonceStoreForTests(): WalletAuthNonceStore {
  testStore = new InMemoryWalletAuthNonceStore();
  cachedStore = null;
  return testStore;
}

/** @internal Resets cached store between tests. */
export function resetWalletAuthNonceStoreForTests(): void {
  cachedStore = null;
  testStore = null;
}
