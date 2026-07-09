import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { jsonResponse, workErrorResponse } from "@/lib/works/api-utils";
import { getPublicWork } from "@/lib/works/catalog-service";
import { parseWorkIdParam } from "@/lib/works/public-dto";

type RouteContext = {
  params: Promise<{ workId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { workId } = await params;
    const parsed = parseWorkIdParam(workId);

    const repositories = await createMongoIndexerRepositories();
    const work = await getPublicWork(repositories, parsed);
    if (!work) {
      return jsonResponse({ error: "Work not found." }, 404);
    }

    return jsonResponse({ work });
  } catch (error) {
    return workErrorResponse(error);
  }
}
