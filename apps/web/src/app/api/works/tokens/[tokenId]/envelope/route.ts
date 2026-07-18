import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { getIpfsStorage } from "@/lib/works/ipfs-server";
import { workErrorResponse, jsonResponse } from "@/lib/works/api-utils";
import {
  parseTokenIdParam,
  pinTokenEnvelopeForAuthor,
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
    const formData = await request.formData();
    const walletAuthRaw = formData.get("walletAuth");
    if (typeof walletAuthRaw !== "string") {
      return jsonResponse({ error: "Invalid payload." }, 422);
    }

    const signer = await verifySignedMutation(JSON.parse(walletAuthRaw));
    const envelopeField = formData.get("envelope");
    if (!(envelopeField instanceof Blob)) {
      return jsonResponse({ error: "Invalid payload." }, 422);
    }

    const envelope = new Uint8Array(await envelopeField.arrayBuffer());
    const repositories = await createMongoIndexerRepositories();
    const result = await pinTokenEnvelopeForAuthor(
      repositories,
      getIpfsStorage(),
      signer,
      tokenId,
      envelope,
    );

    return jsonResponse(result, 201);
  } catch (error) {
    return workErrorResponse(error);
  }
}
