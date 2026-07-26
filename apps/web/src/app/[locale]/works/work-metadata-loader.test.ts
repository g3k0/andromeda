import { afterEach, describe, expect, it, vi } from "vitest";

import { loadPublicWorkMetadata } from "./work-metadata-loader";

const GATEWAYS = {
  ipfs: "https://gateway.test/ipfs",
  arweave: "https://arweave.test",
};

const VALID_METADATA = {
  name: "Short Story",
  description: "Author-certified literary work.",
  image: "ar://CoverTx",
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
    encrypted_content: "ar://CipherTx",
    cipher: "aes-256-gcm",
    envelope_scheme: "ecies-secp256k1",
    tba_standard: "erc-6551",
    chain_id: 137,
    contract: "0x00000000000000000000000000000000000000c8",
    registry: "0x00000000000000000000000000000000000000c9",
  },
};

describe("loadPublicWorkMetadata", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches and parses ar:// metadata via the Arweave gateway", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe("https://arweave.test/MetaTx");
      return new Response(JSON.stringify(VALID_METADATA), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const metadata = await loadPublicWorkMetadata("ar://MetaTx", GATEWAYS);

    expect(metadata?.name).toBe("Short Story");
    expect(metadata?.ace.encrypted_content).toBe("ar://CipherTx");
  });

  it("fetches legacy ipfs:// metadata via the IPFS gateway", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe("https://gateway.test/ipfs/bafymeta");
      return new Response(
        JSON.stringify({
          ...VALID_METADATA,
          image: "ipfs://bafycover",
          ace: {
            ...VALID_METADATA.ace,
            encrypted_content: "ipfs://bafycipher",
          },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const metadata = await loadPublicWorkMetadata("ipfs://bafymeta", GATEWAYS);

    expect(metadata?.image).toBe("ipfs://bafycover");
  });

  it("returns null when the gateway response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("missing", { status: 404 })),
    );

    await expect(
      loadPublicWorkMetadata("ar://missing", GATEWAYS),
    ).resolves.toBeNull();
  });
});
