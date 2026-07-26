import { describe, expect, it } from "vitest";

import { encryptContent, encodeUtf8Plaintext } from "@/lib/content-crypto/content-cipher";
import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import { createArweaveTurboStorage } from "@/lib/ipfs/adapters/arweave-turbo-storage";
import { IpfsMetadataValidationError } from "@/lib/ipfs/errors";
import {
  createFakeTurboUploadClient,
  createFakeTurboUploadState,
} from "@/lib/ipfs/testing/fake-turbo-upload-client";
import { getInMemoryIpfsRecord } from "@/lib/ipfs/testing/in-memory-ipfs-storage";
import { createInMemoryPermanentStorage } from "@/lib/ipfs/testing/in-memory-permanent-storage";

import {
  buildAcePublicMetadata,
  publishWorkToPermanentStorage,
} from "./publish-service";
import { parseWorkImprintFromFormValues } from "./work-imprint-metadata";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const REGISTRY = "0x2222222222222222222222222222222222222222" as const;
const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";

function sampleWorkImprint() {
  return parseWorkImprintFromFormValues(
    {
      publicationDate: "2026-06-01",
      editionNumber: "1",
      editionKind: "first",
      reprintNumber: "",
      seriesName: "",
      seriesVolume: "",
      language: "",
      originalPublicationDate: "",
      backCoverText: "An encrypted science-fiction novella.",
      aboutAuthor: "The author explores distant worlds.",
    },
    AUTHOR,
  );
}

describe("buildAcePublicMetadata", () => {
  it("builds ACE metadata without plaintext fields", () => {
    const metadata = buildAcePublicMetadata({
      name: "The Star Gate",
      workImprint: sampleWorkImprint(),
      imageUri: "ipfs://bafyCover",
      encryptedContentUri: "ipfs://bafyContent",
      chainId: 80002,
      contractAddress: CONTRACT,
      registryAddress: REGISTRY,
    });

    expect(metadata.ace.version).toBe("1");
    expect(metadata.ace.encrypted_content).toBe("ipfs://bafyContent");
    expect(metadata.image).toBe("ipfs://bafyCover");
    expect(metadata.work_imprint.author_address).toBe(AUTHOR);
    expect(metadata.description).toContain("First edition");
  });

  it("builds ACE metadata with ar:// content URIs", () => {
    const metadata = buildAcePublicMetadata({
      name: "The Star Gate",
      workImprint: sampleWorkImprint(),
      imageUri: "ar://CoverTxId",
      encryptedContentUri: "ar://CipherTxId",
      chainId: 80002,
      contractAddress: CONTRACT,
      registryAddress: REGISTRY,
    });

    expect(metadata.image).toBe("ar://CoverTxId");
    expect(metadata.ace.encrypted_content).toBe("ar://CipherTxId");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      buildAcePublicMetadata({
        name: "Bad",
        workImprint: sampleWorkImprint(),
        imageUri: "ipfs://bafyCover",
        encryptedContentUri: "ipfs://bafyContent",
        chainId: 80002,
        contractAddress: CONTRACT,
        registryAddress: REGISTRY,
        attributes: [{ trait_type: "plaintext", value: "secret" }],
      }),
    ).toThrow(/security reasons/i);
  });
});

describe("publishWorkToPermanentStorage", () => {
  it("validates metadata before uploading", async () => {
    const { storage, state } = createInMemoryPermanentStorage();
    const contentKey = generateContentKey();
    const ciphertext = await encryptContent(
      encodeUtf8Plaintext("Once upon a time…"),
      contentKey,
    );

    await expect(
      publishWorkToPermanentStorage(storage, {
        ciphertext,
        coverImage: new TextEncoder().encode("fake-png-bytes"),
        name: "The Star Gate",
        workImprint: sampleWorkImprint(),
        chainId: 80002,
        contractAddress: "" as `0x${string}`,
        registryAddress: REGISTRY,
      }),
    ).rejects.toThrow(IpfsMetadataValidationError);

    expect(state.records.size).toBe(0);
  });

  it("uploads cover, ciphertext, and validated metadata (Pinata path)", async () => {
    const { storage, state } = createInMemoryPermanentStorage();
    const contentKey = generateContentKey();
    const ciphertext = await encryptContent(
      encodeUtf8Plaintext("Once upon a time…"),
      contentKey,
    );

    const result = await publishWorkToPermanentStorage(storage, {
      ciphertext,
      coverImage: new TextEncoder().encode("fake-png-bytes"),
      name: "The Star Gate",
      workImprint: sampleWorkImprint(),
      chainId: 80002,
      contractAddress: CONTRACT,
      registryAddress: REGISTRY,
    });

    expect(result.metadataUri).toMatch(/^ipfs:\/\//);
    expect(result.metadata.ace.encrypted_content).toBe(result.contentUpload.uri);
    expect(result.metadata.image).toBe(result.coverUpload.uri);
    expect(result.metadata.work_imprint.publication_date).toBe("2026-06-01");
    expect(getInMemoryIpfsRecord(state, result.contentUpload.id)).toBeDefined();
    expect(getInMemoryIpfsRecord(state, result.metadataUpload.id)).toBeDefined();
  });

  it("uploads with ar:// URIs when using the Arweave Turbo adapter", async () => {
    const turboState = createFakeTurboUploadState();
    const storage = createArweaveTurboStorage({
      client: createFakeTurboUploadClient(turboState),
      gatewayBaseUrl: "https://arweave.test",
    });
    const contentKey = generateContentKey();
    const ciphertext = await encryptContent(
      encodeUtf8Plaintext("Once upon a time…"),
      contentKey,
    );

    const result = await publishWorkToPermanentStorage(storage, {
      ciphertext,
      coverImage: new TextEncoder().encode("fake-png-bytes"),
      name: "The Star Gate",
      workImprint: sampleWorkImprint(),
      chainId: 80002,
      contractAddress: CONTRACT,
      registryAddress: REGISTRY,
    });

    expect(result.metadataUri).toMatch(/^ar:\/\//);
    expect(result.metadata.image).toMatch(/^ar:\/\//);
    expect(result.metadata.ace.encrypted_content).toMatch(/^ar:\/\//);
    expect(result.metadata.ace.encrypted_content).toBe(result.contentUpload.uri);
    expect(turboState.uploads).toHaveLength(3);
  });
});
