import { connectMongo } from "@/lib/db/mongodb";

import type { IndexerRepositories } from "../ports/work-repository";
import { MongoChainSyncRepository } from "./mongo-chain-sync-repository";
import { MongoTokenRepository } from "./mongo-token-repository";
import { MongoWorkRepository } from "./mongo-work-repository";

export async function createMongoIndexerRepositories(): Promise<IndexerRepositories> {
  await connectMongo();

  return {
    works: new MongoWorkRepository(),
    tokens: new MongoTokenRepository(),
    chainSync: new MongoChainSyncRepository(),
  };
}
