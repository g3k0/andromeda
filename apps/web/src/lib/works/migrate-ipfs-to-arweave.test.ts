import { describe, expect, it, vi } from "vitest";

import {
  migrateWorkToArweave,
  summarizeMigrationOrphans,
} from "./migrate-ipfs-to-arweave";

const VALID_METADATA = {
  name: "Legacy Story",
  description: "Author-certified literary work.",
  image: "ipfs://bafycover",
  work_imprint: {
    publication_date: "2026-06-01",
    edition_number: 1,
    edition_kind: "first",
    back_cover_text: "Author-certified literary work.",
    about_author: "Jane Doe is a writer.",
    author_address: "0x00000000000000000000000000000000000000c8",
  },
  ace: {
    version: "1",
    encrypted_content: "ipfs://bafycipher",
    cipher: "aes-256-gcm",
    envelope_scheme: "ecies-secp256k1",
    tba_standard: "erc-6551",
    chain_id: 137,
    contract: "0x00000000000000000000000000000000000000c8",
    registry: "0x00000000000000000000000000000000000000c9",
  },
};

describe("migrateWorkToArweave", () => {
  it("uploads IPFS blobs to Arweave and suggests updateWorkMetadataURI", async () => {
    const fetchBytes = vi.fn(async (uri: string) => {
      if (uri === "ipfs://bafymeta") {
        return new TextEncoder().encode(JSON.stringify(VALID_METADATA));
      }
      if (uri === "ipfs://bafycover") {
        return new Uint8Array([1, 2, 3]);
      }
      if (uri === "ipfs://bafycipher") {
        return new Uint8Array([4, 5, 6]);
      }
      throw new Error(`unexpected ${uri}`);
    });
    let uploadCount = 0;
    const uploadBlob = vi.fn(async () => {
      uploadCount += 1;
      return { uri: `ar://blob${uploadCount}` };
    });
    const uploadJson = vi.fn(async () => ({ uri: "ar://meta1" }));

    const result = await migrateWorkToArweave(
      { workId: 7n, metadataUri: "ipfs://bafymeta" },
      { fetchBytes, uploadBlob, uploadJson },
    );

    expect(result.newWorkMetadataUri).toBe("ar://meta1");
    expect(result.suggestedOnChain.updateWorkMetadataURI).toEqual({
      workId: "7",
      metadataUri: "ar://meta1",
    });
    expect(result.rows.filter((row) => row.status === "ok")).toHaveLength(3);
    expect(uploadJson).toHaveBeenCalledWith(
      expect.objectContaining({
        image: "ar://blob1",
        ace: expect.objectContaining({
          encrypted_content: "ar://blob2",
        }),
      }),
      expect.objectContaining({ name: "work-7-work-metadata.json" }),
    );
  });

  it("marks unreachable IPFS content as orphan", async () => {
    const result = await migrateWorkToArweave(
      { workId: 1n, metadataUri: "ipfs://missing" },
      {
        fetchBytes: async () => {
          throw new Error("gateway 404");
        },
        uploadBlob: async () => ({ uri: "ar://x" }),
        uploadJson: async () => ({ uri: "ar://y" }),
      },
    );

    expect(result.newWorkMetadataUri).toBeNull();
    expect(summarizeMigrationOrphans(result.rows)).toHaveLength(1);
    expect(result.rows[0]?.status).toBe("orphan");
    expect(result.rows[0]?.error).toContain("gateway 404");
  });

  it("migrates copy envelopes and skips non-ipfs work URIs", async () => {
    const uploadBlob = vi.fn(async () => ({ uri: "ar://envelope1" }));
    const result = await migrateWorkToArweave(
      {
        workId: 2n,
        metadataUri: "ar://already",
        tokens: [
          {
            tokenId: 9n,
            metadataURI: null,
            envelopeCid: "ipfs://bafyenvelope",
          },
        ],
      },
      {
        fetchBytes: async (uri) => {
          expect(uri).toBe("ipfs://bafyenvelope");
          return new Uint8Array([9]);
        },
        uploadBlob,
        uploadJson: async () => ({ uri: "ar://unused" }),
      },
    );

    expect(result.rows.find((row) => row.kind === "work-metadata")?.status).toBe(
      "skipped",
    );
    expect(result.suggestedOnChain.setCopyEnvelopeURI).toEqual([
      { tokenId: "9", envelopeUri: "ar://envelope1" },
    ]);
  });
});
