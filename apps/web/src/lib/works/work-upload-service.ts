import "server-only";

import type { WorkUploadRepository } from "./ports/work-upload-repository";
import type { CreateWorkUploadInput, WorkUploadRecord } from "./types";

export type WorkUploadService = {
  createUpload(input: CreateWorkUploadInput): Promise<WorkUploadRecord>;
  listByAuthor(author: string): Promise<WorkUploadRecord[]>;
  markRegistered(metadataURI: string, workId: string): Promise<WorkUploadRecord | null>;
};

export function createWorkUploadService(
  repository: WorkUploadRepository,
): WorkUploadService {
  return {
    createUpload(input) {
      return repository.create(input);
    },
    listByAuthor(author) {
      return repository.listByAuthor(author);
    },
    markRegistered(metadataURI, workId) {
      return repository.markRegistered(metadataURI, workId);
    },
  };
}
