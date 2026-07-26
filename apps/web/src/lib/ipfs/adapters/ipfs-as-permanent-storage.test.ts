import { describe, expect, it, vi } from "vitest";

import { createInMemoryIpfsState, createInMemoryIpfsStorage } from "../testing/in-memory-ipfs-storage";
import { adaptIpfsStorageToPermanent } from "./ipfs-as-permanent-storage";

describe("adaptIpfsStorageToPermanent", () => {
  it("maps pin APIs to upload APIs and keeps ipfs:// URIs", async () => {
    const ipfs = createInMemoryIpfsStorage(createInMemoryIpfsState());
    const storage = adaptIpfsStorageToPermanent(ipfs, {
      ipfsGatewayBaseUrl: "https://gateway.pinata.cloud/ipfs",
      arweaveGatewayBaseUrl: "https://arweave.net",
    });

    const blob = await storage.uploadBlob(new TextEncoder().encode("hello"), {
      name: "test-blob",
    });
    expect(blob.uri.startsWith("ipfs://")).toBe(true);
    expect(blob.id.length).toBeGreaterThan(0);
    expect(blob.size).toBeGreaterThan(0);

    const json = await storage.uploadJson({ ok: true }, { name: "test-json" });
    expect(json.uri.startsWith("ipfs://")).toBe(true);

    expect(storage.toGatewayUrl(blob.uri)).toContain(blob.id);
    expect(storage.toGatewayUrl("ar://TxId999")).toBe(
      "https://arweave.net/TxId999",
    );
  });

  it("delegates pinBlob/pinJson to the underlying IPFS port", async () => {
    const pinBlob = vi.fn().mockResolvedValue({
      cid: "bafyblob",
      uri: "ipfs://bafyblob",
      size: 4,
    });
    const pinJson = vi.fn().mockResolvedValue({
      cid: "bafyjson",
      uri: "ipfs://bafyjson",
      size: 2,
    });
    const storage = adaptIpfsStorageToPermanent(
      {
        pinBlob,
        pinJson,
        toGatewayUrl: (uri) => `https://gateway.test/ipfs/${uri}`,
      },
      { ipfsGatewayBaseUrl: "https://gateway.test/ipfs" },
    );

    await storage.uploadBlob(new Uint8Array([1, 2, 3]));
    await storage.uploadJson({ a: 1 });
    expect(pinBlob).toHaveBeenCalledOnce();
    expect(pinJson).toHaveBeenCalledOnce();
  });
});
