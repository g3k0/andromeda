import "server-only";

import { createMongoWorkUploadRepository } from "./adapters/create-work-upload-repository";
import {
  createWorkUploadService,
  type WorkUploadService,
} from "./work-upload-service";
import { InMemoryWorkUploadRepository } from "./testing/in-memory-work-upload-repository";

let cachedService: WorkUploadService | null = null;
let testRepository: InMemoryWorkUploadRepository | null = null;

function shouldUseInMemoryRepositoryForTests(): boolean {
  return process.env.VITEST === "true" && !process.env.MONGODB_URI;
}

export async function getWorkUploadService(): Promise<WorkUploadService> {
  if (shouldUseInMemoryRepositoryForTests()) {
    if (!testRepository) {
      testRepository = new InMemoryWorkUploadRepository();
    }
    return createWorkUploadService(testRepository);
  }

  if (!cachedService) {
    const repository = await createMongoWorkUploadRepository();
    cachedService = createWorkUploadService(repository);
  }
  return cachedService;
}

/** @internal Resets cached service between tests. */
export function resetWorkUploadServiceForTests(): void {
  cachedService = null;
  testRepository = null;
}

/** @internal Uses in-memory repository in unit tests without MongoDB. */
export function useInMemoryWorkUploadServiceForTests(): InMemoryWorkUploadRepository {
  testRepository = new InMemoryWorkUploadRepository();
  cachedService = createWorkUploadService(testRepository);
  return testRepository;
}
