import type { ContentUri } from "@/lib/ipfs/content-uri";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { PermanentStoragePort } from "@/lib/ipfs/ports/permanent-storage-port";

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
  metadataUri: ContentUri;
};

export async function provisionEditionMetadata(
  storage: PermanentStoragePort,
  input: ProvisionEditionMetadataInput,
): Promise<ProvisionedEditionCopy[]> {
  assertSignerIsAuthor(input.signerAddress, input.authorAddress);

  return Promise.all(
    input.copies.map(async (copy) => {
      const provisioned = await provisionTokenMetadata(storage, {
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
