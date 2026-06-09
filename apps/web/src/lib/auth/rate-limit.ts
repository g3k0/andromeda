import {
  getRateLimitStore,
  resetRateLimitStoreForTests,
  useInMemoryRateLimitStoreForTests,
} from "./rate-limit-server";

export const DEFAULT_RATE_LIMIT = 30;
export const DEFAULT_RATE_WINDOW_MS = 60_000;

export async function checkRateLimit(
  key: string,
  limit = DEFAULT_RATE_LIMIT,
  windowMs = DEFAULT_RATE_WINDOW_MS,
  now = Date.now(),
): Promise<boolean> {
  const store = await getRateLimitStore();
  return store.increment(key, limit, windowMs, new Date(now));
}

/** @internal */
export function resetRateLimitsForTests(): void {
  resetRateLimitStoreForTests();
}

/** @internal */
export function useInMemoryRateLimitsForTests(): void {
  useInMemoryRateLimitStoreForTests();
}
