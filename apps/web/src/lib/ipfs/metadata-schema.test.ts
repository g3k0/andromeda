import { describe, expect, it } from "vitest";

import { IpfsMetadataValidationError } from "./errors";
import {
  isAcePublicMetadata,
  parseAcePublicMetadata,
} from "./metadata-schema";

const VALID_METADATA = {
  name: "Short Story — Work #3",
  description: "Author-certified literary work.",
  image: "ipfs://bafybeigcovercid",
  external_url: "https://andromeda-bookstore.xyz/works/3",
  attributes: [
    { trait_type: "Author", value: "Jane Doe" },
    { trait_type: "Edition", value: 100 },
  ],
  ace: {
    version: "1",
    encrypted_content: "ipfs://bafybeigciphertextcid",
    cipher: "aes-256-gcm",
    envelope_scheme: "ecies-secp256k1",
    tba_standard: "erc-6551",
    chain_id: 137,
    contract: "0x00000000000000000000000000000000000000c8",
    registry: "0x00000000000000000000000000000000000000c9",
  },
} as const;

describe("parseAcePublicMetadata", () => {
  it("accepts valid OpenSea-compatible ACE metadata", () => {
    expect(parseAcePublicMetadata(VALID_METADATA)).toEqual(VALID_METADATA);
    expect(isAcePublicMetadata(VALID_METADATA)).toBe(true);
  });

  it("rejects metadata missing required ace fields", () => {
    const withoutAce = {
      name: VALID_METADATA.name,
      description: VALID_METADATA.description,
      image: VALID_METADATA.image,
      external_url: VALID_METADATA.external_url,
      attributes: VALID_METADATA.attributes,
    };

    expect(() => parseAcePublicMetadata(withoutAce)).toThrow(
      IpfsMetadataValidationError,
    );
    expect(isAcePublicMetadata(withoutAce)).toBe(false);
  });

  it("rejects forbidden secret key fields anywhere in the payload", () => {
    expect(() =>
      parseAcePublicMetadata({
        ...VALID_METADATA,
        contentKey: "0102030405060708090a0b0c0d0e0f10",
      }),
    ).toThrow(IpfsMetadataValidationError);

    try {
      parseAcePublicMetadata({
        ...VALID_METADATA,
        ace: {
          ...VALID_METADATA.ace,
          nested: { private_key: "secret" },
        },
      });
      expect.fail("expected metadata validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(IpfsMetadataValidationError);
      expect((error as IpfsMetadataValidationError).issues).toContain(
        "Forbidden metadata key: ace.nested.private_key",
      );
    }
  });

  it("rejects plaintext content references in attributes", () => {
    try {
      parseAcePublicMetadata({
        ...VALID_METADATA,
        attributes: [
          {
            trait_type: "plaintext",
            value: "ipfs://bafybeiplaintextcid",
          },
        ],
      });
      expect.fail("expected metadata validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(IpfsMetadataValidationError);
      expect((error as IpfsMetadataValidationError).issues[0]).toMatch(
        /exposes plaintext content/,
      );
    }

    try {
      parseAcePublicMetadata({
        ...VALID_METADATA,
        attributes: [
          {
            trait_type: "Draft plaintext excerpt",
            value: "ipfs://bafybeiplaintextcid",
          },
        ],
      });
      expect.fail("expected metadata validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(IpfsMetadataValidationError);
      expect((error as IpfsMetadataValidationError).issues[0]).toMatch(
        /plaintext content CID/,
      );
    }
  });

  it("rejects unknown top-level fields", () => {
    expect(() =>
      parseAcePublicMetadata({
        ...VALID_METADATA,
        plaintext: "Once upon a time",
      }),
    ).toThrow(IpfsMetadataValidationError);
  });
});
