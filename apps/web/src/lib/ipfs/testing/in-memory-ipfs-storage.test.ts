import { describe, expect, it } from "vitest";

import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
  getInMemoryIpfsRecord,
} from "./in-memory-ipfs-storage";

describe("createInMemoryIpfsStorage", () => {
  it("pins blobs with deterministic CIDs", async () => {
    const state = createInMemoryIpfsState();
    const storage = createInMemoryIpfsStorage(state);
    const payload = new TextEncoder().encode("encrypted manuscript");

    const first = await storage.pinBlob(payload, { name: "work-1.txt" });
    const second = await storage.pinBlob(payload, { name: "work-1.txt" });

    expect(first.cid).toBe(second.cid);
    expect(first.uri).toBe(`ipfs://${first.cid}`);
    expect(first.size).toBe(payload.byteLength);
    expect(getInMemoryIpfsRecord(state, first.cid)?.name).toBe("work-1.txt");
  });

  it("pins JSON metadata and resolves gateway URLs", async () => {
    const state = createInMemoryIpfsState({
      gatewayBaseUrl: "https://ipfs.example.test",
    });
    const storage = createInMemoryIpfsStorage(state);
    const metadata = {
      name: "Work #1",
      description: "Author-certified literary work.",
      image: "ipfs://bafybeigcover",
      ace: {
        version: "1",
        encrypted_content: "ipfs://bafybeigciphertext",
        cipher: "aes-256-gcm",
        envelope_scheme: "ecies-secp256k1",
        tba_standard: "erc-6551",
        chain_id: 137,
        contract: "0x00000000000000000000000000000000000000c8",
        registry: "0x00000000000000000000000000000000000000c9",
      },
    };

    const result = await storage.pinJson(metadata, { name: "metadata.json" });
    const stored = getInMemoryIpfsRecord(state, result.cid);

    expect(stored?.bytes).toEqual(
      new TextEncoder().encode(JSON.stringify(metadata)),
    );
    expect(storage.toGatewayUrl(result.cid)).toBe(
      `https://ipfs.example.test/${result.cid}`,
    );
    expect(storage.toGatewayUrl(result.uri)).toBe(
      `https://ipfs.example.test/${result.cid}`,
    );
  });
});
