import {
  ACE_CONTENT_CIPHER,
  ACE_ENVELOPE_SCHEME,
  ACE_TBA_STANDARD,
  ACE_VERSION,
} from "@/lib/content-crypto/ace-spec";
import type { ContentUri } from "@/lib/ipfs/content-uri";
import { parseAcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { PermanentStoragePort } from "@/lib/ipfs/ports/permanent-storage-port";

import {
  buildWorkDescriptionFromImprint,
  workImprintToAttributes,
} from "./work-imprint-metadata";
import type {
  BuildAceMetadataInput,
  PublishWorkInput,
  PublishWorkResult,
} from "./types";

/** Placeholder content URI for imprint-only validation before uploads exist. */
const METADATA_URI_PLACEHOLDER =
  "ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as ContentUri;

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

/**
 * Uploads cover, ciphertext, and ACE metadata to permanent storage.
 * Backend is selected by `getPermanentStorage()` (Pinata or Arweave).
 */
export async function publishWorkToPermanentStorage(
  storage: PermanentStoragePort,
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

  const uploadBaseName = slugifyUploadName(input.name);
  const [coverUpload, contentUpload] = await Promise.all([
    storage.uploadBlob(input.coverImage, {
      name: `${uploadBaseName}-cover`,
    }),
    storage.uploadBlob(input.ciphertext, {
      name: `${uploadBaseName}-content`,
    }),
  ]);

  const metadata = buildAcePublicMetadata({
    name: input.name,
    workImprint: input.workImprint,
    imageUri: coverUpload.uri,
    encryptedContentUri: contentUpload.uri,
    chainId: input.chainId,
    contractAddress: input.contractAddress,
    registryAddress: input.registryAddress,
    externalUrl: input.externalUrl,
    attributes: input.attributes,
  });

  const metadataUpload = await storage.uploadJson(metadata, {
    name: `${uploadBaseName}-metadata`,
  });

  return {
    coverUpload,
    contentUpload,
    metadataUpload,
    metadata,
    metadataUri: metadataUpload.uri,
  };
}

function slugifyUploadName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "work";
}
