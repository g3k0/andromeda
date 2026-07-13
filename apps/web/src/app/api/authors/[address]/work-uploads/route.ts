import { normalizeAddress } from "@/lib/authors/address";
import { enforceRateLimit, jsonResponse as authorJsonResponse } from "@/lib/authors/api-utils";
import { getAuthorService } from "@/lib/authors/server";
import { workErrorResponse, jsonResponse } from "@/lib/works/api-utils";
import { toPublicWorkUploadDto } from "@/lib/works/public-dto";
import { getWorkUploadService } from "@/lib/works/work-upload-server";

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

    const limited = await enforceRateLimit(request, `list-work-uploads:${normalized}`);
    if (limited) {
      return limited;
    }

    const authorService = await getAuthorService();
    const profile = await authorService.getAuthorByAddress(normalized);
    if (!profile) {
      return authorJsonResponse({ error: "Author profile not found." }, 404);
    }

    const uploadService = await getWorkUploadService();
    const uploads = await uploadService.listByAuthor(normalized);

    return jsonResponse(
      uploads.map(toPublicWorkUploadDto),
      200,
      {
        "Cache-Control": "public, max-age=60",
      },
    );
  } catch (error) {
    return workErrorResponse(error);
  }
}
