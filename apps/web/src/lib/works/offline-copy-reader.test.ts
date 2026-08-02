import { describe, expect, it, vi } from "vitest";

import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import {
  encodeUtf8Plaintext,
  encryptContent,
} from "@/lib/content-crypto/content-cipher";
import { wrapContentKey } from "@/lib/content-crypto/envelope";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

import {
  assertArweaveCopyUris,
  OfflineCopyDiscoveryError,
  readOfflineCopy,
  resolveOfflineCopyUris,
} from "./offline-copy-reader";
import { deriveReaderKeypairFromSignature } from "./reader-signer";

const SIGNATURE = ("0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8" +
  "1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac81b") as `0x${string}`;

function metadata(encryptedContent: string): AcePublicMetadata {
  return {
    name: "Offline Novella",
    description: "A novella.",
    image: "ar://CoverTx",
    work_imprint: {
      publication_date: "2026-06-01",
      edition_number: 1,
      edition_kind: "first",
      back_cover_text: "Back cover.",
      about_author: "About the author.",
      author_address: "0x1111111111111111111111111111111111111111",
    },
    ace: {
      version: "1",
      encrypted_content: encryptedContent,
      cipher: "aes-256-gcm",
      envelope_scheme: "ecies-secp256k1",
      tba_standard: "erc-6551",
      chain_id: 80002,
      contract: "0x1111111111111111111111111111111111111111",
      registry: "0x2222222222222222222222222222222222222222",
    },
  } as AcePublicMetadata;
}

describe("resolveOfflineCopyUris", () => {
  it("reads tokenURI and envelopeURIOfToken from chain", async () => {
    const uris = await resolveOfflineCopyUris(10n, {
      tokenURI: async () => "ar://MetaTx",
      envelopeURIOfToken: async () => "ar://EnvelopeTx",
    });
    expect(uris).toEqual({
      metadataUri: "ar://MetaTx",
      envelopeUri: "ar://EnvelopeTx",
    });
  });

  it("rejects empty envelope URI", async () => {
    await expect(
      resolveOfflineCopyUris(1n, {
        tokenURI: async () => "ar://MetaTx",
        envelopeURIOfToken: async () => "  ",
      }),
    ).rejects.toBeInstanceOf(OfflineCopyDiscoveryError);
  });

  it("rejects non-positive tokenId and empty metadata", async () => {
    await expect(
      resolveOfflineCopyUris(0n, {
        tokenURI: async () => "ar://MetaTx",
        envelopeURIOfToken: async () => "ar://EnvelopeTx",
      }),
    ).rejects.toThrow(/positive integer/);
    await expect(
      resolveOfflineCopyUris(1n, {
        tokenURI: async () => "",
        envelopeURIOfToken: async () => "ar://EnvelopeTx",
      }),
    ).rejects.toThrow(/tokenURI is empty/);
  });
});

describe("assertArweaveCopyUris", () => {
  it("accepts ar:// pair and rejects ipfs metadata", () => {
    expect(() =>
      assertArweaveCopyUris({
        metadataUri: "ar://a",
        envelopeUri: "ar://b",
      }),
    ).not.toThrow();
    expect(() =>
      assertArweaveCopyUris({
        metadataUri: "ipfs://legacy",
        envelopeUri: "ar://b",
      }),
    ).toThrow(/Expected ar:\/\//);
    expect(() =>
      assertArweaveCopyUris({
        metadataUri: "ar://a",
        envelopeUri: "ipfs://legacy",
      }),
    ).toThrow(/Expected ar:\/\/ envelope/);
  });
});

describe("readOfflineCopy", () => {
  it("decrypts a copy using only chain URIs and gateway fetches", async () => {
    const { publicKey } = deriveReaderKeypairFromSignature(SIGNATURE);
    const contentKey = generateContentKey();
    const ciphertext = await encryptContent(
      encodeUtf8Plaintext("Hello, offline reader."),
      contentKey,
    );
    const envelope = wrapContentKey(contentKey, publicKey);

    const result = await readOfflineCopy({
      tokenId: 10n,
      signature: SIGNATURE,
      chain: {
        tokenURI: async () => "ar://MetaTx",
        envelopeURIOfToken: async () => "ar://EnvelopeTx",
      },
      fetchJson: async () => metadata("ar://CipherTx"),
      fetchBytes: async (uri) => {
        if (uri === "ar://EnvelopeTx") {
          return envelope;
        }
        if (uri === "ar://CipherTx") {
          return ciphertext;
        }
        throw new Error(`unexpected ${uri}`);
      },
    });

    expect(result.text).toBe("Hello, offline reader.");
    expect(result.uris.metadataUri).toBe("ar://MetaTx");
  });

  it("fails when requireArweave and metadata is still ipfs", async () => {
    await expect(
      readOfflineCopy({
        tokenId: 1n,
        signature: SIGNATURE,
        chain: {
          tokenURI: async () => "ipfs://legacy",
          envelopeURIOfToken: async () => "ar://EnvelopeTx",
        },
        fetchJson: vi.fn(),
        fetchBytes: vi.fn(),
      }),
    ).rejects.toBeInstanceOf(OfflineCopyDiscoveryError);
  });
});
