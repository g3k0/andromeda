import { describe, expect, it, vi } from "vitest";

import { createPinataIpfsStorage } from "./pinata-ipfs-storage";

const CONFIG = {
  apiKey: "test-jwt-token",
  gatewayBaseUrl: "https://gateway.pinata.cloud/ipfs",
} as const;

describe("createPinataIpfsStorage", () => {
  it("pins JSON via Pinata and returns generic errors on failure", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            IpfsHash: "bafybeigmetadata",
            PinSize: 128,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("nope", { status: 500 }));

    const storage = createPinataIpfsStorage({
      ...CONFIG,
      fetchImpl,
      pinJsonUrl: "https://pinata.test/pinJSONToIPFS",
    });

    const metadata = { name: "Work #1" };
    const result = await storage.pinJson(metadata, { name: "metadata.json" });

    expect(result).toEqual({
      cid: "bafybeigmetadata",
      uri: "ipfs://bafybeigmetadata",
      size: 128,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://pinata.test/pinJSONToIPFS",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt-token",
          "Content-Type": "application/json",
        }),
      }),
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(storage.pinJson(metadata)).rejects.toThrow(
      /Unable to pin metadata to IPFS/,
    );
    expect(errorSpy).toHaveBeenCalled();
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(parsed).toMatchObject({
      scope: "ipfs.pinata",
      event: "pin_http_error",
      status: 500,
    });
    expect(parsed).not.toHaveProperty("stack");
    errorSpy.mockRestore();
  });

  it("returns a generic error when Pinata responds without a CID", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ PinSize: 10 }), { status: 200 }),
    );
    const storage = createPinataIpfsStorage({
      ...CONFIG,
      fetchImpl,
    });

    await expect(storage.pinJson({ name: "Work #1" })).rejects.toThrow(
      /Unable to pin metadata to IPFS/,
    );
  });

  it("pins blobs via multipart upload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          IpfsHash: "bafybeigblob",
          PinSize: 64,
        }),
        { status: 200 },
      ),
    );

    const storage = createPinataIpfsStorage({
      ...CONFIG,
      fetchImpl,
      pinFileUrl: "https://pinata.test/pinFileToIPFS",
    });

    const payload = new TextEncoder().encode("encrypted content");
    const result = await storage.pinBlob(payload, { name: "work.txt" });

    expect(result.cid).toBe("bafybeigblob");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://pinata.test/pinFileToIPFS",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt-token",
        }),
      }),
    );
    expect(storage.toGatewayUrl(result.cid)).toBe(
      "https://gateway.pinata.cloud/ipfs/bafybeigblob",
    );
  });
});
