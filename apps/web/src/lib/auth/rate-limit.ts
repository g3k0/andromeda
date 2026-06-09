import {
  getRateLimitMaxRequests,
  getRateLimitWindowMs,
} from "@/lib/config/auth";
import {
  getRateLimitStore,
  resetRateLimitStoreForTests,
  useInMemoryRateLimitStoreForTests,
} from "./rate-limit-server";

export async function checkRateLimit(
  key: string,
  limit = getRateLimitMaxRequests(),
  windowMs = getRateLimitWindowMs(),
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
