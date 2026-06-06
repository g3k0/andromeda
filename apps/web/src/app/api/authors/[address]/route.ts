import { assertCanUpdateAuthorProfile } from "@/lib/authors/authorize";
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/authors/api-utils";
import { normalizeAddress } from "@/lib/authors/address";
import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { updateAuthorBodySchema } from "@/lib/authors/schemas";
import { getAuthorService } from "@/lib/authors/server";

type RouteContext = {
  params: Promise<{ address: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { address: addressParam } = await context.params;
    const normalized = normalizeAddress(addressParam);
    if (!normalized) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const service = await getAuthorService();
    const profile = await service.getAuthorByAddress(normalized);
    if (!profile) {
      return jsonResponse({ error: "Author profile not found." }, 404);
    }

    return jsonResponse(profile, 200, {
      "Cache-Control": "public, max-age=60",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { address: addressParam } = await context.params;
    const normalized = normalizeAddress(addressParam);
    if (!normalized) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const limited = enforceRateLimit(request, `patch-author:${normalized}`);
    if (limited) {
      return limited;
    }

    const body = updateAuthorBodySchema.parse(await request.json());
    const signer = await verifySignedMutation(body);
    assertCanUpdateAuthorProfile(signer, normalized);

    const service = await getAuthorService();
    const existing = await service.getAuthorByAddress(normalized);
    if (!existing) {
      return jsonResponse({ error: "Author profile not found." }, 404);
    }

    const updated = await service.upsertAuthor({
      ...existing,
      displayName: body.displayName,
      avatarUrl: body.avatarUrl ?? null,
    });

    return jsonResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
