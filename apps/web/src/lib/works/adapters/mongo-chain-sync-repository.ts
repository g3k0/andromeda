import {
  ANDROMEDA_WORKS_SYNC_KEY,
  ChainSyncModel,
} from "@/lib/db/models/chain-sync.model";

import type { ChainSyncRepository } from "../ports/work-repository";

export class MongoChainSyncRepository implements ChainSyncRepository {
  constructor(private readonly key: string = ANDROMEDA_WORKS_SYNC_KEY) {}

  async getLastProcessedBlock(): Promise<bigint> {
    const doc = await ChainSyncModel.findOne({ key: this.key }).lean();
    return BigInt(doc?.lastProcessedBlock ?? "0");
  }

  async setLastProcessedBlock(block: bigint): Promise<void> {
    await ChainSyncModel.findOneAndUpdate(
      { key: this.key },
      { $set: { lastProcessedBlock: block.toString() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
}
