import "server-only";

import { createMongoRateLimitStore } from "./adapters/create-rate-limit-store";
import type { RateLimitStore } from "./rate-limit-store";
import { InMemoryRateLimitStore } from "./testing/in-memory-rate-limit-store";

let cachedStore: RateLimitStore | null = null;
let testStore: RateLimitStore | null = null;

export async function getRateLimitStore(): Promise<RateLimitStore> {
  if (testStore) {
    return testStore;
  }

  if (!cachedStore) {
    cachedStore = await createMongoRateLimitStore();
  }

  return cachedStore;
}

/** @internal Uses in-memory store for unit tests. */
export function useInMemoryRateLimitStoreForTests(): RateLimitStore {
  testStore = new InMemoryRateLimitStore();
  cachedStore = null;
  return testStore;
}

/** @internal Resets cached store between tests. */
export function resetRateLimitStoreForTests(): void {
  cachedStore = null;
  testStore = null;
}
