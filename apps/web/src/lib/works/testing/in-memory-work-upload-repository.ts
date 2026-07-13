import { WorkUploadMetadataExistsError } from "../errors";
import type { WorkUploadRepository } from "../ports/work-upload-repository";
import type { CreateWorkUploadInput, WorkUploadRecord } from "../types";

export class InMemoryWorkUploadRepository implements WorkUploadRepository {
  private readonly records = new Map<string, WorkUploadRecord>();
  private nextId = 1;

  async create(input: CreateWorkUploadInput): Promise<WorkUploadRecord> {
    if (
      [...this.records.values()].some(
        (record) =>
          record.metadataCid === input.metadataCid ||
          record.metadataURI === input.metadataURI,
      )
    ) {
      throw new WorkUploadMetadataExistsError(input.metadataCid);
    }

    const now = new Date().toISOString();
    const record: WorkUploadRecord = {
      id: String(this.nextId++),
      author: input.author.toLowerCase() as WorkUploadRecord["author"],
      name: input.name,
      metadataURI: input.metadataURI,
      metadataCid: input.metadataCid,
      contentCid: input.contentCid,
      coverCid: input.coverCid,
      externalUrl: input.externalUrl ?? null,
      workImprint: input.workImprint,
      status: "uploaded",
      workId: null,
      registeredAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.records.set(record.id, record);
    return record;
  }

  async getByMetadataCid(metadataCid: string): Promise<WorkUploadRecord | null> {
    return (
      [...this.records.values()].find(
        (record) => record.metadataCid === metadataCid,
      ) ?? null
    );
  }

  async listByAuthor(author: string): Promise<WorkUploadRecord[]> {
    const normalized = author.toLowerCase();
    return [...this.records.values()]
      .filter((record) => record.author.toLowerCase() === normalized)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async markRegistered(
    metadataURI: string,
    workId: string,
  ): Promise<WorkUploadRecord | null> {
    const record = [...this.records.values()].find(
      (entry) => entry.metadataURI === metadataURI && entry.status === "uploaded",
    );
    if (!record) {
      return null;
    }

    const updated: WorkUploadRecord = {
      ...record,
      status: "registered",
      workId,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.records.set(record.id, updated);
    return updated;
  }

  clear(): void {
    this.records.clear();
    this.nextId = 1;
  }
}
