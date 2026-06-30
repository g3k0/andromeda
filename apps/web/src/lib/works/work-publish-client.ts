import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import { encryptContent } from "@/lib/content-crypto/content-cipher";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { SignedWalletPayload } from "@/lib/auth/client-wallet-auth";

import { readManuscriptFile } from "./manuscript-upload";
import type { WorkPublishFormValues } from "./work-publish-form-state";

export type UploadWorkPublishInput = {
  values: WorkPublishFormValues;
  authorAddress: string;
  coverImage: File;
  manuscriptFile: File;
  walletAuth: SignedWalletPayload;
};

export type UploadWorkPublishResult = {
  metadataUri: string;
  metadata: AcePublicMetadata;
  contentKey: Uint8Array;
};

export async function uploadWorkPublishPayload(
  input: UploadWorkPublishInput,
  fetchImpl: typeof fetch = fetch,
): Promise<UploadWorkPublishResult> {
  const contentKey = generateContentKey();
  const manuscriptBytes = await readManuscriptFile(input.manuscriptFile);
  const ciphertext = await encryptContent(manuscriptBytes, contentKey);

  const formData = new FormData();
  formData.set("walletAuth", JSON.stringify(input.walletAuth));
  formData.set("name", input.values.name.trim());
  formData.set("authorAddress", input.authorAddress);
  formData.set("publicationDate", input.values.publicationDate);
  formData.set("editionNumber", input.values.editionNumber);
  formData.set("editionKind", input.values.editionKind);
  formData.set("reprintNumber", input.values.reprintNumber);
  formData.set("seriesName", input.values.seriesName);
  formData.set("seriesVolume", input.values.seriesVolume);
  formData.set("language", input.values.language);
  formData.set("originalPublicationDate", input.values.originalPublicationDate);
  if (input.values.externalUrl.trim()) {
    formData.set("externalUrl", input.values.externalUrl.trim());
  }
  formData.set(
    "ciphertext",
    new Blob([Uint8Array.from(ciphertext)], { type: "application/octet-stream" }),
  );
  formData.set("coverImage", input.coverImage);

  const response = await fetchImpl("/api/works/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Work upload failed.");
  }

  const json = (await response.json()) as {
    metadataUri: string;
    metadata: AcePublicMetadata;
  };

  return {
    metadataUri: json.metadataUri,
    metadata: json.metadata,
    contentKey,
  };
}
