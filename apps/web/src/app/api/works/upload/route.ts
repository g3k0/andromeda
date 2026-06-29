import { enforceRateLimit } from "@/lib/authors/api-utils";
import { getIpfsStorage } from "@/lib/works/ipfs-server";
import { workErrorResponse, jsonResponse } from "@/lib/works/api-utils";
import { runWorkUploadMutation } from "@/lib/works/work-upload-mutations";

export async function POST(request: Request): Promise<Response> {
  try {
    const limited = await enforceRateLimit(request, "works-upload");
    if (limited) {
      return limited;
    }

    const formData = await request.formData();
    const result = await runWorkUploadMutation(formData, {
      ipfs: getIpfsStorage(),
    });

    return jsonResponse(
      {
        metadataUri: result.metadataUri,
        metadataCid: result.metadataPin.cid,
        contentCid: result.contentPin.cid,
        coverCid: result.coverPin.cid,
        metadata: result.metadata,
      },
      201,
    );
  } catch (error) {
    return workErrorResponse(error);
  }
}
