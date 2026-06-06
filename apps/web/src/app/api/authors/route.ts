import { assertCanCreateAuthorProfile } from "@/lib/authors/authorize";
import { enforceRateLimit, errorResponse, jsonResponse } from "@/lib/authors/api-utils";
import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { createAuthorBodySchema } from "@/lib/authors/schemas";
import { getAuthorService } from "@/lib/authors/server";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = createAuthorBodySchema.parse(await request.json());
    const limited = enforceRateLimit(request, `create-author:${body.address}`);
    if (limited) {
      return limited;
    }

    const signer = await verifySignedMutation(body);
    assertCanCreateAuthorProfile(signer, body.address);

    const service = await getAuthorService();
    const profile = await service.createAuthorProfile(body.address, {
      displayName: body.displayName,
      avatarUrl: body.avatarUrl ?? null,
    });

    return jsonResponse(profile, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
