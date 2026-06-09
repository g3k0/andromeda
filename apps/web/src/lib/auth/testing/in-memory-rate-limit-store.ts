import type { RateLimitStore } from "../rate-limit-store";

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<
    string,
    { count: number; resetAt: number }
  >();

  async increment(
    key: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean> {
    const timestamp = now.getTime();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= timestamp) {
      this.buckets.set(key, { count: 1, resetAt: timestamp + windowMs });
      return true;
    }

    if (bucket.count >= limit) {
      return false;
    }

    bucket.count += 1;
    return true;
  }

  async clear(): Promise<void> {
    this.buckets.clear();
  }
}
