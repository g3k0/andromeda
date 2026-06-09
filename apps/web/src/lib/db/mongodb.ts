import "server-only";

import { getMongoDbUri } from "@/lib/config/env";
import mongoose from "mongoose";
import { MongoDbUriMissingError } from "./errors";

export { getMongoDbUri } from "@/lib/config/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

function getMongooseCache(): MongooseCache {
  if (!global.mongooseCache) {
    global.mongooseCache = { conn: null, promise: null };
  }
  return global.mongooseCache;
}

export async function connectMongo(): Promise<typeof mongoose> {
  const cache = getMongooseCache();

  if (cache.conn) {
    return cache.conn;
  }

  const uri = getMongoDbUri();
  if (!uri) {
    throw new MongoDbUriMissingError();
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri).then((connection) => connection);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/** @internal Resets the cached connection between tests. */
export function resetMongoConnectionForTests(): void {
  const cache = getMongooseCache();
  cache.conn = null;
  cache.promise = null;
}
