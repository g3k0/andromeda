import { runUpdateAuthorMutation } from "@/lib/authors/author-mutations";
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/authors/api-utils";
import { normalizeAddress } from "@/lib/authors/address";
import { updateAuthorMutationSchema } from "@/lib/authors/schemas";
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

    const limited = await enforceRateLimit(request, `patch-author:${normalized}`);
    if (limited) {
      return limited;
    }

    const body = updateAuthorMutationSchema.parse(await request.json());
    const updated = await runUpdateAuthorMutation(normalized, body);
    return jsonResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
