import "server-only";

import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { getAuthorService } from "@/lib/authors/server";
import { getUserService } from "@/lib/users/server";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import { assertCanPublishWork } from "./authorize";
import { resolveWorkPublishChainConfig } from "./work-publish-chain-config";
import { publishWorkToIpfs } from "./publish-service";
import type { WorkUploadMutationResult } from "./types";
import { assertNoDuplicateWorkUpload } from "./work-upload-duplicate";
import { parseWorkUploadFiles } from "./upload-form";
import { parseWorkUploadFields } from "./upload-schemas";
import { assertWorkUploadWalletRateLimit } from "./work-upload-rate-limit";
import { getWorkUploadService } from "./work-upload-server";

export type WorkUploadMutationDeps = {
  ipfs: IpfsStoragePort;
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

  const published = await publishWorkToIpfs(deps.ipfs, {
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
    metadataCid: published.metadataPin.cid,
    contentCid: published.contentPin.cid,
    coverCid: published.coverPin.cid,
    externalUrl: fields.externalUrl,
    workImprint: fields.imprint,
  });

  return {
    ...published,
    upload,
  };
}
