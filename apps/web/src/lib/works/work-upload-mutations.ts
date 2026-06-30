import "server-only";

import { getContractAddress } from "@/lib/config/public-env";
import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { getAuthorService } from "@/lib/authors/server";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import {
  getErc6551RegistryAddress,
  getTargetChainId,
} from "@/lib/tba/tba-registry";

import { assertCanPublishWork } from "./authorize";
import { publishWorkToIpfs } from "./publish-service";
import type { PublishWorkResult } from "./types";
import { parseWorkUploadFiles } from "./upload-form";
import { parseWorkUploadFields } from "./upload-schemas";

export type WorkUploadMutationDeps = {
  ipfs: IpfsStoragePort;
};

export async function runWorkUploadMutation(
  formData: FormData,
  deps: WorkUploadMutationDeps,
): Promise<PublishWorkResult> {
  const fields = parseWorkUploadFields(formData);
  const files = await parseWorkUploadFiles(formData);
  const signer = await verifySignedMutation(fields);

  const authorService = await getAuthorService();
  const hasAuthorProfile = await authorService.hasAuthorProfile(fields.address);
  assertCanPublishWork(signer, fields.address, hasAuthorProfile);

  return publishWorkToIpfs(deps.ipfs, {
    ciphertext: files.ciphertext,
    coverImage: files.coverImage,
    name: fields.name,
    workImprint: fields.imprint,
    chainId: getTargetChainId(),
    contractAddress: getContractAddress(),
    registryAddress: getErc6551RegistryAddress(),
    externalUrl: fields.externalUrl,
  });
}
