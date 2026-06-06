import { runCreateAuthorMutation } from "@/lib/authors/author-mutations";
import { enforceRateLimit, errorResponse, jsonResponse } from "@/lib/authors/api-utils";
import { createAuthorBodySchema } from "@/lib/authors/schemas";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = createAuthorBodySchema.parse(await request.json());
    const limited = enforceRateLimit(request, `create-author:${body.address}`);
    if (limited) {
      return limited;
    }

    const profile = await runCreateAuthorMutation(body);
    return jsonResponse(profile, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
