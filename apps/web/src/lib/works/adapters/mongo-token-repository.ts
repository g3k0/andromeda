import { toTokenRecord } from "@/lib/db/models/mappers";
import { TokenModel } from "@/lib/db/models/token.model";

import type { TokenRepository } from "../ports/work-repository";
import type { PendingTokenEnvelope, TokenRecord, UpsertTokenInput } from "../types";

export class MongoTokenRepository implements TokenRepository {
  async upsertToken(input: UpsertTokenInput): Promise<TokenRecord> {
    const doc = await TokenModel.findOneAndUpdate(
      { tokenId: input.tokenId.toString() },
      {
        $set: {
          workId: input.workId.toString(),
          owner: input.owner.toLowerCase(),
          ...(input.copyNumber !== undefined
            ? { copyNumber: input.copyNumber }
            : {}),
          ...(input.tbaAddress !== undefined
            ? { tbaAddress: input.tbaAddress }
            : {}),
          ...(input.envelopeCid !== undefined
            ? { envelopeCid: input.envelopeCid }
            : {}),
          ...(input.envelopeRecipientPublicKey !== undefined
            ? { envelopeRecipientPublicKey: input.envelopeRecipientPublicKey }
            : {}),
          ...(input.metadataURI !== undefined
            ? { metadataURI: input.metadataURI }
            : {}),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    ).lean();

    if (!doc) {
      throw new Error(`Token upsert failed for ${input.tokenId.toString()}`);
    }

    return toTokenRecord(doc);
  }

  async getToken(tokenId: bigint): Promise<TokenRecord | null> {
    const doc = await TokenModel.findOne({ tokenId: tokenId.toString() }).lean();
    return doc ? toTokenRecord(doc) : null;
  }

  async listByOwner(owner: string): Promise<TokenRecord[]> {
    const docs = await TokenModel.find({ owner: owner.toLowerCase() })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map(toTokenRecord);
  }

  async setOwner(tokenId: bigint, owner: string): Promise<boolean> {
    const result = await TokenModel.updateOne(
      { tokenId: tokenId.toString() },
      { $set: { owner: owner.toLowerCase() } },
    );
    return result.matchedCount > 0;
  }

  async setMetadataURI(tokenId: bigint, metadataURI: string): Promise<boolean> {
    const result = await TokenModel.updateOne(
      { tokenId: tokenId.toString() },
      { $set: { metadataURI } },
    );
    return result.matchedCount > 0;
  }

  async setEnvelopeRecipientPublicKey(
    tokenId: bigint,
    recipientPublicKeyBase64: string,
  ): Promise<boolean> {
    const result = await TokenModel.updateOne(
      { tokenId: tokenId.toString() },
      { $set: { envelopeRecipientPublicKey: recipientPublicKeyBase64 } },
    );
    return result.matchedCount > 0;
  }

  async setEnvelopeCid(tokenId: bigint, envelopeCid: string): Promise<boolean> {
    const result = await TokenModel.updateOne(
      { tokenId: tokenId.toString() },
      { $set: { envelopeCid } },
    );
    return result.matchedCount > 0;
  }

  async listPendingEnvelopesByAuthor(author: string): Promise<PendingTokenEnvelope[]> {
    const { WorkModel } = await import("@/lib/db/models/work.model");
    const authorWorks = await WorkModel.find({ author: author.toLowerCase() })
      .select({ workId: 1, metadataURI: 1 })
      .lean();
    if (authorWorks.length === 0) {
      return [];
    }

    const metadataByWorkId = new Map(
      authorWorks.map((work) => [work.workId, work.metadataURI]),
    );
    const workIds = [...metadataByWorkId.keys()];

    const docs = await TokenModel.find({
      workId: { $in: workIds },
      envelopeCid: null,
      envelopeRecipientPublicKey: { $ne: null },
    })
      .sort({ tokenId: 1 })
      .lean();

    return docs.map((doc) => ({
      tokenId: BigInt(doc.tokenId),
      workId: BigInt(doc.workId),
      metadataURI: doc.metadataURI ?? metadataByWorkId.get(doc.workId) ?? "",
      recipientPublicKeyBase64: doc.envelopeRecipientPublicKey!,
    }));
  }
}
