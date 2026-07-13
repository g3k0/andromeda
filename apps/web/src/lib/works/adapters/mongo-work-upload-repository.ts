import { toWorkUploadRecord } from "@/lib/db/models/mappers";
import { WorkUploadModel } from "@/lib/db/models/work-upload.model";

import { WorkUploadMetadataExistsError } from "../errors";
import type { WorkUploadRepository } from "../ports/work-upload-repository";
import type { CreateWorkUploadInput, WorkUploadRecord } from "../types";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export class MongoWorkUploadRepository implements WorkUploadRepository {
  async create(input: CreateWorkUploadInput): Promise<WorkUploadRecord> {
    try {
      const doc = await WorkUploadModel.create({
        author: input.author.toLowerCase(),
        name: input.name,
        metadataURI: input.metadataURI,
        metadataCid: input.metadataCid,
        contentCid: input.contentCid,
        coverCid: input.coverCid,
        externalUrl: input.externalUrl ?? null,
        workImprint: input.workImprint,
        status: "uploaded",
      });

      return toWorkUploadRecord(doc);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new WorkUploadMetadataExistsError(input.metadataCid);
      }
      throw error;
    }
  }

  async getByMetadataCid(metadataCid: string): Promise<WorkUploadRecord | null> {
    const doc = await WorkUploadModel.findOne({ metadataCid }).lean();
    return doc ? toWorkUploadRecord(doc) : null;
  }

  async listByAuthor(author: string): Promise<WorkUploadRecord[]> {
    const docs = await WorkUploadModel.find({ author: author.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(toWorkUploadRecord);
  }

  async markRegistered(
    metadataURI: string,
    workId: string,
  ): Promise<WorkUploadRecord | null> {
    const doc = await WorkUploadModel.findOneAndUpdate(
      { metadataURI, status: "uploaded" },
      {
        $set: {
          status: "registered",
          workId,
          registeredAt: new Date(),
        },
      },
      { returnDocument: "after" },
    ).lean();

    return doc ? toWorkUploadRecord(doc) : null;
  }
}
