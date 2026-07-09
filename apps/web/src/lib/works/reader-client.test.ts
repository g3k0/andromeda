import { describe, expect, it } from "vitest";

import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import {
  encodeUtf8Plaintext,
  encryptContent,
} from "@/lib/content-crypto/content-cipher";
import { wrapContentKey } from "@/lib/content-crypto/envelope";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

import { decodeUtf8, readWorkContent } from "./reader-client";
import {
  createReaderSignerFromSignature,
  deriveReaderKeypairFromSignature,
} from "./reader-signer";

const GATEWAY = "https://gateway.test/ipfs";
const SIGNATURE = ("0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8" +
  "1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac81b") as `0x${string}`;

function metadata(): AcePublicMetadata {
  return {
    name: "The Star Gate",
    description: "A novella.",
    image: "ipfs://bafycover",
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
      encrypted_content: "ipfs://bafycipher",
      cipher: "aes-256-gcm",
      envelope_scheme: "ecies-secp256k1",
      tba_standard: "erc-6551",
      chain_id: 80002,
      contract: "0x1111111111111111111111111111111111111111",
      registry: "0x2222222222222222222222222222222222222222",
    },
  } as AcePublicMetadata;
}

describe("readWorkContent", () => {
  it("fetches, unwraps and decrypts the work content in-browser", async () => {
    const { publicKey } = deriveReaderKeypairFromSignature(SIGNATURE);
    const contentKey = generateContentKey();
    const ciphertext = await encryptContent(
      encodeUtf8Plaintext("Hello, reader."),
      contentKey,
    );
    const envelope = wrapContentKey(contentKey, publicKey);

    const plaintext = await readWorkContent({
      metadataUrl: `${GATEWAY}/bafymeta`,
      envelopeUrl: `${GATEWAY}/bafyenvelope`,
      gatewayBaseUrl: GATEWAY,
      tbaSigner: createReaderSignerFromSignature(SIGNATURE),
      fetchJson: async () => metadata(),
      fetchBytes: async (url) => {
        if (url.endsWith("/bafyenvelope")) {
          return envelope;
        }
        if (url === `${GATEWAY}/bafycipher`) {
          return ciphertext;
        }
        throw new Error(`Unexpected fetch: ${url}`);
      },
    });

    expect(decodeUtf8(plaintext)).toBe("Hello, reader.");
  });

  it("rejects metadata that fails ACE validation", async () => {
    await expect(
      readWorkContent({
        metadataUrl: `${GATEWAY}/bafymeta`,
        envelopeUrl: `${GATEWAY}/bafyenvelope`,
        gatewayBaseUrl: GATEWAY,
        tbaSigner: createReaderSignerFromSignature(SIGNATURE),
        fetchJson: async () => ({ not: "valid" }),
        fetchBytes: async () => new Uint8Array(),
      }),
    ).rejects.toThrow();
  });
});
