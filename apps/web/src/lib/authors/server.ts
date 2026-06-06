import { createMongoAuthorRepositories } from "./adapters/create-repositories";
import { createAuthorService, type AuthorService } from "./author-service";

let cachedService: AuthorService | null = null;

export async function getAuthorService(): Promise<AuthorService> {
  if (!cachedService) {
    const repositories = await createMongoAuthorRepositories();
    cachedService = createAuthorService(repositories);
  }
  return cachedService;
}

/** @internal Resets cached service between tests. */
export function resetAuthorServiceForTests(): void {
  cachedService = null;
}
