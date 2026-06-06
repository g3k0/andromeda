type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const DEFAULT_RATE_LIMIT = 30;
export const DEFAULT_RATE_WINDOW_MS = 60_000;

export function checkRateLimit(
  key: string,
  limit = DEFAULT_RATE_LIMIT,
  windowMs = DEFAULT_RATE_WINDOW_MS,
  now = Date.now(),
): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/** @internal */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
