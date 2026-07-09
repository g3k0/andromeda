import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { jsonResponse, workErrorResponse } from "@/lib/works/api-utils";
import { listLibraryCopies } from "@/lib/works/library-service";
import { parseOwnerParam } from "@/lib/works/public-dto";

type RouteContext = {
  params: Promise<{ owner: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { owner } = await params;
    const parsed = parseOwnerParam(owner);

    const repositories = await createMongoIndexerRepositories();
    const copies = await listLibraryCopies(repositories, parsed);

    return jsonResponse({ copies });
  } catch (error) {
    return workErrorResponse(error);
  }
}
