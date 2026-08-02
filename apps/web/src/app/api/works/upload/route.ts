import { logServerError } from "@/lib/logging/server-logger";
import { getPermanentStorage } from "@/lib/works/ipfs-server";
import {
  workErrorResponse,
  jsonResponse,
} from "@/lib/works/api-utils";
import { mapWorkErrorToStatus } from "@/lib/works/api-errors";
import { toPublicWorkUploadDto } from "@/lib/works/public-dto";
import { runWorkUploadMutation } from "@/lib/works/work-upload-mutations";
import { assertWorkUploadIpRateLimit } from "@/lib/works/work-upload-rate-limit";

export async function POST(request: Request): Promise<Response> {
  try {
    await assertWorkUploadIpRateLimit(request);

    const formData = await request.formData();
    const result = await runWorkUploadMutation(
      formData,
      {
        storage: getPermanentStorage(),
      },
      request,
    );

    return jsonResponse(
      {
        metadataUri: result.metadataUri,
        metadataCid: result.metadataUpload.id,
        contentCid: result.contentUpload.id,
        coverCid: result.coverUpload.id,
        metadata: result.metadata,
        upload: toPublicWorkUploadDto(result.upload),
      },
      201,
    );
  } catch (error) {
    if (mapWorkErrorToStatus(error) >= 500) {
      logServerError("works.upload", "failed", error);
    }
    return workErrorResponse(error);
  }
}
