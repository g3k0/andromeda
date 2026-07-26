import "server-only";

import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { getAuthorService } from "@/lib/authors/server";
import { getUserService } from "@/lib/users/server";
import type { PermanentStoragePort } from "@/lib/ipfs/ports/permanent-storage-port";
import { assertCanPublishWork } from "./authorize";
import { resolveWorkPublishChainConfig } from "./work-publish-chain-config";
import { publishWorkToPermanentStorage } from "./publish-service";
import type { WorkUploadMutationResult } from "./types";
import { assertNoDuplicateWorkUpload } from "./work-upload-duplicate";
import { parseWorkUploadFiles } from "./upload-form";
import { parseWorkUploadFields } from "./upload-schemas";
import { assertWorkUploadWalletRateLimit } from "./work-upload-rate-limit";
import { getWorkUploadService } from "./work-upload-server";

export type WorkUploadMutationDeps = {
  storage: PermanentStoragePort;
};

export async function runWorkUploadMutation(
  formData: FormData,
  deps: WorkUploadMutationDeps,
  request: Request,
): Promise<WorkUploadMutationResult> {
  const fields = parseWorkUploadFields(formData);
  const signer = await verifySignedMutation(fields);
  await assertWorkUploadWalletRateLimit(request, signer);

  const userService = await getUserService();
  const signerUser = await userService.getAuthenticatedByAddress(signer);
  if (signerUser) {
    userService.assertActive(signerUser);
  }

  const [files, authorService] = await Promise.all([
    parseWorkUploadFiles(formData),
    getAuthorService(),
  ]);
  const hasAuthorProfile = await authorService.hasAuthorProfile(fields.address);
  assertCanPublishWork(signer, fields.address, hasAuthorProfile);

  const uploadService = await getWorkUploadService();
  const existingUploads = await uploadService.listByAuthor(fields.address);
  assertNoDuplicateWorkUpload(existingUploads, {
    name: fields.name,
    workImprint: fields.imprint,
  });

  const chainConfig = resolveWorkPublishChainConfig();

  const published = await publishWorkToPermanentStorage(deps.storage, {
    ciphertext: files.ciphertext,
    coverImage: files.coverImage,
    name: fields.name,
    workImprint: fields.imprint,
    chainId: chainConfig.chainId,
    contractAddress: chainConfig.contractAddress,
    registryAddress: chainConfig.registryAddress,
    externalUrl: fields.externalUrl,
  });

  const upload = await uploadService.createUpload({
    author: fields.address,
    name: fields.name,
    metadataURI: published.metadataUri,
    // Mongo field names keep *Cid for opaque storage ids (CID or Arweave tx id).
    metadataCid: published.metadataUpload.id,
    contentCid: published.contentUpload.id,
    coverCid: published.coverUpload.id,
    externalUrl: fields.externalUrl,
    workImprint: fields.imprint,
  });

  return {
    ...published,
    upload,
  };
}
