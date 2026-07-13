import type { CreateWorkUploadInput, WorkUploadRecord } from "../types";

export type WorkUploadRepository = {
  create(input: CreateWorkUploadInput): Promise<WorkUploadRecord>;
  getByMetadataCid(metadataCid: string): Promise<WorkUploadRecord | null>;
  listByAuthor(author: string): Promise<WorkUploadRecord[]>;
  markRegistered(metadataURI: string, workId: string): Promise<WorkUploadRecord | null>;
};
