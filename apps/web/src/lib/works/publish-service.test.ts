import { describe, expect, it } from "vitest";

import { encryptContent, encodeUtf8Plaintext } from "@/lib/content-crypto/content-cipher";
import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
  getInMemoryIpfsRecord,
} from "@/lib/ipfs/testing/in-memory-ipfs-storage";

import { buildAcePublicMetadata, publishWorkToIpfs } from "./publish-service";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const REGISTRY = "0x2222222222222222222222222222222222222222" as const;

describe("buildAcePublicMetadata", () => {
  it("builds ACE metadata without plaintext fields", () => {
    const metadata = buildAcePublicMetadata({
      name: "The Star Gate",
      description: "A science-fiction novella.",
      imageUri: "ipfs://bafyCover",
      encryptedContentUri: "ipfs://bafyContent",
      chainId: 80002,
      contractAddress: CONTRACT,
      registryAddress: REGISTRY,
    });

    expect(metadata.ace.version).toBe("1");
    expect(metadata.ace.encrypted_content).toBe("ipfs://bafyContent");
    expect(metadata.image).toBe("ipfs://bafyCover");
  });

  it("rejects forbidden metadata keys", () => {
    expect(() =>
      buildAcePublicMetadata({
        name: "Bad",
        description: "Bad",
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

describe("publishWorkToIpfs", () => {
  it("pins cover, ciphertext, and validated metadata", async () => {
    const state = createInMemoryIpfsState();
    const ipfs = createInMemoryIpfsStorage(state);
    const contentKey = generateContentKey();
    const ciphertext = await encryptContent(
      encodeUtf8Plaintext("Once upon a time…"),
      contentKey,
    );

    const result = await publishWorkToIpfs(ipfs, {
      ciphertext,
      coverImage: new TextEncoder().encode("fake-png-bytes"),
      name: "The Star Gate",
      description: "Encrypted novella.",
      chainId: 80002,
      contractAddress: CONTRACT,
      registryAddress: REGISTRY,
    });

    expect(result.metadataUri).toMatch(/^ipfs:\/\//);
    expect(result.metadata.ace.encrypted_content).toBe(result.contentPin.uri);
    expect(result.metadata.image).toBe(result.coverPin.uri);
    expect(getInMemoryIpfsRecord(state, result.contentPin.cid)).toBeDefined();
    expect(getInMemoryIpfsRecord(state, result.metadataPin.cid)).toBeDefined();
  });
});
