import {
  ACE_CONTENT_CIPHER,
  ACE_ENVELOPE_SCHEME,
  ACE_TBA_STANDARD,
  ACE_VERSION,
} from "@/lib/content-crypto/ace-spec";
import { parseAcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import type { IpfsUri } from "@/lib/ipfs/types";

import {
  buildWorkDescriptionFromImprint,
  workImprintToAttributes,
} from "./work-imprint-metadata";
import type {
  BuildAceMetadataInput,
  PublishWorkInput,
  PublishWorkResult,
} from "./types";

const METADATA_URI_PLACEHOLDER =
  "ipfs://bafybeigcccccccccccccccccccccccccccccccccccc" as const;

export function buildAcePublicMetadata(
  input: BuildAceMetadataInput,
): ReturnType<typeof parseAcePublicMetadata> {
  const description = buildWorkDescriptionFromImprint(input.workImprint);
  const attributes = [
    ...workImprintToAttributes(input.workImprint),
    ...(input.attributes ?? []),
  ];

  return parseAcePublicMetadata({
    name: input.name,
    description,
    image: input.imageUri,
    work_imprint: input.workImprint,
    ...(input.externalUrl ? { external_url: input.externalUrl } : {}),
    ...(attributes.length ? { attributes } : {}),
    ace: {
      version: ACE_VERSION,
      encrypted_content: input.encryptedContentUri,
      cipher: ACE_CONTENT_CIPHER,
      envelope_scheme: ACE_ENVELOPE_SCHEME,
      tba_standard: ACE_TBA_STANDARD,
      chain_id: input.chainId,
      contract: input.contractAddress,
      registry: input.registryAddress,
    },
  });
}

export async function publishWorkToIpfs(
  ipfs: IpfsStoragePort,
  input: PublishWorkInput,
): Promise<PublishWorkResult> {
  buildAcePublicMetadata({
    name: input.name,
    workImprint: input.workImprint,
    imageUri: METADATA_URI_PLACEHOLDER,
    encryptedContentUri: METADATA_URI_PLACEHOLDER,
    chainId: input.chainId,
    contractAddress: input.contractAddress,
    registryAddress: input.registryAddress,
    externalUrl: input.externalUrl,
    attributes: input.attributes,
  });

  const coverPin = await ipfs.pinBlob(input.coverImage, {
    name: `${slugifyPinName(input.name)}-cover`,
  });

  const contentPin = await ipfs.pinBlob(input.ciphertext, {
    name: `${slugifyPinName(input.name)}-content`,
  });

  const metadata = buildAcePublicMetadata({
    name: input.name,
    workImprint: input.workImprint,
    imageUri: coverPin.uri,
    encryptedContentUri: contentPin.uri as IpfsUri,
    chainId: input.chainId,
    contractAddress: input.contractAddress,
    registryAddress: input.registryAddress,
    externalUrl: input.externalUrl,
    attributes: input.attributes,
  });

  const metadataPin = await ipfs.pinJson(metadata, {
    name: `${slugifyPinName(input.name)}-metadata`,
  });

  return {
    coverPin,
    contentPin,
    metadataPin,
    metadata,
    metadataUri: metadataPin.uri,
  };
}

function slugifyPinName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "work";
}
