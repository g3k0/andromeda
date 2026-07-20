import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import type { IpfsUri } from "@/lib/ipfs/types";

import { assertSignerIsAuthor } from "./authorize";
import { provisionTokenMetadata } from "./token-metadata-service";

export type EditionCopyInput = {
  tokenId: bigint;
  copyNumber: number;
};

export type ProvisionEditionMetadataInput = {
  signerAddress: string;
  authorAddress: string;
  workMetadata: AcePublicMetadata;
  maxCopies: bigint;
  copies: readonly EditionCopyInput[];
};

export type ProvisionedEditionCopy = {
  tokenId: bigint;
  copyNumber: number;
  metadataUri: IpfsUri;
};

export async function provisionEditionMetadata(
  ipfs: IpfsStoragePort,
  input: ProvisionEditionMetadataInput,
): Promise<ProvisionedEditionCopy[]> {
  assertSignerIsAuthor(input.signerAddress, input.authorAddress);

  return Promise.all(
    input.copies.map(async (copy) => {
      const provisioned = await provisionTokenMetadata(ipfs, {
        tokenId: copy.tokenId,
        workMetadata: input.workMetadata,
        copyNumber: copy.copyNumber,
        maxCopies: input.maxCopies,
      });

      return {
        tokenId: copy.tokenId,
        copyNumber: copy.copyNumber,
        metadataUri: provisioned.metadataUri,
      };
    }),
  );
}
