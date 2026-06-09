import { RateLimitBucketModel } from "@/lib/db/models/rate-limit-bucket.model";
import type { RateLimitStore } from "../rate-limit-store";

export class MongoRateLimitStore implements RateLimitStore {
  async increment(
    key: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean> {
    const resetAt = new Date(now.getTime() + windowMs);
    const existing = await RateLimitBucketModel.findOne({ key }).lean();

    if (!existing || existing.resetAt.getTime() <= now.getTime()) {
      await RateLimitBucketModel.findOneAndUpdate(
        { key },
        { $set: { count: 1, resetAt } },
        { upsert: true, new: true },
      );
      return true;
    }

    if (existing.count >= limit) {
      return false;
    }

    const updated = await RateLimitBucketModel.findOneAndUpdate(
      { key, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { new: true },
    ).lean();

    return Boolean(updated);
  }

  async clear(): Promise<void> {
    await RateLimitBucketModel.deleteMany({});
  }
}
