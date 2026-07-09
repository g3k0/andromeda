import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { jsonResponse, workErrorResponse } from "@/lib/works/api-utils";
import { listPublicWorks } from "@/lib/works/catalog-service";

export async function GET(): Promise<Response> {
  try {
    const repositories = await createMongoIndexerRepositories();
    const works = await listPublicWorks(repositories);
    return jsonResponse({ works });
  } catch (error) {
    return workErrorResponse(error);
  }
}
