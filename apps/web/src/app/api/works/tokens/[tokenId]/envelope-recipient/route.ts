import { enforceRateLimit } from "@/lib/authors/api-utils";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { workErrorResponse, jsonResponse } from "@/lib/works/api-utils";
import {
  parseTokenIdParam,
  registerTokenEnvelopeRecipient,
} from "@/lib/works/token-envelope-service";

type RouteContext = {
  params: Promise<{ tokenId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { tokenId: tokenIdParam } = await context.params;
    const tokenId = parseTokenIdParam(tokenIdParam);

    const limited = await enforceRateLimit(
      request,
      `register-envelope-recipient:${tokenId.toString()}`,
    );
    if (limited) {
      return limited;
    }

    const body = (await request.json()) as { recipientPublicKey?: unknown };
    if (typeof body.recipientPublicKey !== "string") {
      return jsonResponse({ error: "Invalid payload." }, 422);
    }

    const repositories = await createMongoIndexerRepositories();
    await registerTokenEnvelopeRecipient(
      repositories,
      tokenId,
      body.recipientPublicKey,
    );

    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    return workErrorResponse(error);
  }
}
