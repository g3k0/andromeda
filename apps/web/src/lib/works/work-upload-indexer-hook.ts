import "server-only";

import { getWorkUploadService } from "./work-upload-server";

/** Marks off-chain upload metadata as registered after a WorkRegistered event. */
export async function markWorkUploadRegistered(
  metadataURI: string,
  workId: string,
): Promise<void> {
  const uploadService = await getWorkUploadService();
  await uploadService.markRegistered(metadataURI, workId);
}
