import { getIpfsStorage } from "@/lib/works/ipfs-server";
import { workErrorResponse, jsonResponse } from "@/lib/works/api-utils";
import { runWorkUploadMutation } from "@/lib/works/work-upload-mutations";
import { assertWorkUploadIpRateLimit } from "@/lib/works/work-upload-rate-limit";

export async function POST(request: Request): Promise<Response> {
  try {
    await assertWorkUploadIpRateLimit(request);

    const formData = await request.formData();
    const result = await runWorkUploadMutation(formData, {
      ipfs: getIpfsStorage(),
    }, request);

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
