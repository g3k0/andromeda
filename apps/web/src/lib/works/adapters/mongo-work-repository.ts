import { toWorkRecord } from "@/lib/db/models/mappers";
import { WorkModel } from "@/lib/db/models/work.model";

import type { WorkRepository } from "../ports/work-repository";
import type { UpsertWorkInput, WorkRecord } from "../types";

export class MongoWorkRepository implements WorkRepository {
  async upsertWork(input: UpsertWorkInput): Promise<WorkRecord> {
    const doc = await WorkModel.findOneAndUpdate(
      { workId: input.workId.toString() },
      {
        $set: {
          author: input.author.toLowerCase(),
          metadataURI: input.metadataURI,
          price: input.price.toString(),
          maxCopies: input.maxCopies.toString(),
          ...(input.active !== undefined ? { active: input.active } : {}),
          ...(input.encryptedContentCid !== undefined
            ? { encryptedContentCid: input.encryptedContentCid }
            : {}),
        },
        $setOnInsert: {
          minted: "0",
          primarySaleRemaining: input.maxCopies.toString(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    ).lean();

    if (!doc) {
      throw new Error(`Work upsert failed for ${input.workId.toString()}`);
    }

    return toWorkRecord(doc);
  }

  async getWork(workId: bigint): Promise<WorkRecord | null> {
    const doc = await WorkModel.findOne({ workId: workId.toString() }).lean();
    return doc ? toWorkRecord(doc) : null;
  }

  async listWorks(): Promise<WorkRecord[]> {
    const docs = await WorkModel.find({}).sort({ createdAt: 1 }).lean();
    return docs.map(toWorkRecord);
  }

  async setActive(workId: bigint, active: boolean): Promise<void> {
    await WorkModel.updateOne(
      { workId: workId.toString() },
      { $set: { active } },
    );
  }

  async setMetadataURI(workId: bigint, metadataURI: string): Promise<boolean> {
    const result = await WorkModel.updateOne(
      { workId: workId.toString() },
      { $set: { metadataURI } },
    );
    return (result.matchedCount ?? 0) > 0;
  }

  async setMinted(workId: bigint, minted: bigint): Promise<void> {
    await WorkModel.updateOne(
      { workId: workId.toString() },
      { $set: { minted: minted.toString() } },
    );
  }

  async decrementPrimarySaleRemaining(workId: bigint): Promise<void> {
    const doc = await WorkModel.findOne({ workId: workId.toString() }).lean();
    if (!doc) {
      return;
    }

    const current = BigInt(doc.primarySaleRemaining ?? doc.maxCopies);
    if (current === 0n) {
      return;
    }

    await WorkModel.updateOne(
      { workId: workId.toString() },
      { $set: { primarySaleRemaining: (current - 1n).toString() } },
    );
  }
}
