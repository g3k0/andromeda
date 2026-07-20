import { normalizeAddress } from "@/lib/authors/address";
import { enforceRateLimit, jsonResponse as authorJsonResponse } from "@/lib/authors/api-utils";
import { getAuthorService } from "@/lib/authors/server";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { workErrorResponse, jsonResponse } from "@/lib/works/api-utils";
import { listPendingTokenEnvelopesForAuthor } from "@/lib/works/token-envelope-service";

type RouteContext = {
  params: Promise<{ address: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { address: addressParam } = await context.params;
    const normalized = normalizeAddress(addressParam);
    if (!normalized) {
      return authorJsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const limited = await enforceRateLimit(
      request,
      `pending-envelopes:${normalized}`,
    );
    if (limited) {
      return limited;
    }

    const authorService = await getAuthorService();
    const profile = await authorService.getAuthorByAddress(normalized);
    if (!profile) {
      return authorJsonResponse({ error: "Author profile not found." }, 404);
    }

    const repositories = await createMongoIndexerRepositories();
    const pending = await listPendingTokenEnvelopesForAuthor(
      repositories,
      normalized,
    );

    return jsonResponse(
      pending.map((entry) => ({
        tokenId: entry.tokenId.toString(),
        workId: entry.workId.toString(),
        metadataURI: entry.metadataURI,
        recipientPublicKeyBase64: entry.recipientPublicKeyBase64,
      })),
      200,
      { "Cache-Control": "no-store" },
    );
  } catch (error) {
    return workErrorResponse(error);
  }
}
