import "server-only";

import { connectMongo } from "@/lib/db/mongodb";
import type { RateLimitStore } from "../rate-limit-store";
import { MongoRateLimitStore } from "./mongo-rate-limit-store";

export async function createMongoRateLimitStore(): Promise<RateLimitStore> {
  await connectMongo();
  return new MongoRateLimitStore();
}
