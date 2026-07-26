import { describe, expect, it, vi } from "vitest";

import { parseArweaveJwk } from "../arweave-jwk";
import { ArweaveUploadError } from "../errors";
import {
  createFakeTurboUploadClient,
  createFakeTurboUploadState,
} from "../testing/fake-turbo-upload-client";
import {
  ANDROMEDA_APP_NAME_TAG,
  createArweaveTurboStorage,
} from "./arweave-turbo-storage";

describe("createArweaveTurboStorage", () => {
  it("uploads JSON as ar:// with Andromeda tags", async () => {
    const state = createFakeTurboUploadState();
    const storage = createArweaveTurboStorage({
      client: createFakeTurboUploadClient(state),
      gatewayBaseUrl: "https://arweave.test",
    });

    const result = await storage.uploadJson(
      { hello: "world" },
      { name: "meta.json" },
    );

    expect(result.uri).toBe("ar://fakeTx1");
    expect(result.id).toBe("fakeTx1");
    expect(result.size).toBeGreaterThan(0);
    expect(state.uploads).toHaveLength(1);
    expect(state.uploads[0]?.data).toBe(JSON.stringify({ hello: "world" }));
    expect(state.uploads[0]?.tags).toEqual(
      expect.arrayContaining([
        { name: "Content-Type", value: "application/json" },
        ANDROMEDA_APP_NAME_TAG,
        { name: "File-Name", value: "meta.json" },
      ]),
    );
    expect(storage.toGatewayUrl(result.uri)).toBe(
      "https://arweave.test/fakeTx1",
    );
  });

  it("uploads blobs as octet-stream", async () => {
    const state = createFakeTurboUploadState();
    const storage = createArweaveTurboStorage({
      client: createFakeTurboUploadClient(state),
    });
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const result = await storage.uploadBlob(bytes);

    expect(result.uri).toBe("ar://fakeTx1");
    expect(result.size).toBe(4);
    expect(state.uploads[0]?.tags).toEqual(
      expect.arrayContaining([
        { name: "Content-Type", value: "application/octet-stream" },
        ANDROMEDA_APP_NAME_TAG,
      ]),
    );
  });

  it("maps Turbo failures to ArweaveUploadError", async () => {
    const state = createFakeTurboUploadState({ failNext: true });
    const storage = createArweaveTurboStorage({
      client: createFakeTurboUploadClient(state),
    });

    await expect(storage.uploadJson({ a: 1 })).rejects.toBeInstanceOf(
      ArweaveUploadError,
    );
  });

  it("fetches bytes via the Arweave gateway", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(new Uint8Array([9, 8, 7]), { status: 200 }),
    );
    const storage = createArweaveTurboStorage({
      client: createFakeTurboUploadClient(),
      gatewayBaseUrl: "https://arweave.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const bytes = await storage.fetchBytes!("ar://abc123");

    expect(fetchImpl).toHaveBeenCalledWith("https://arweave.test/abc123");
    expect(Array.from(bytes)).toEqual([9, 8, 7]);
  });

  it("rejects failed gateway fetches", async () => {
    const storage = createArweaveTurboStorage({
      client: createFakeTurboUploadClient(),
      gatewayBaseUrl: "https://arweave.test",
      fetchImpl: (async () =>
        new Response("nope", { status: 404 })) as unknown as typeof fetch,
    });

    await expect(storage.fetchBytes!("ar://missing")).rejects.toBeInstanceOf(
      ArweaveUploadError,
    );
  });
});

describe("parseArweaveJwk", () => {
  it("accepts a minimal RSA JWK object", () => {
    const jwk = parseArweaveJwk(
      JSON.stringify({ kty: "RSA", n: "x", e: "AQAB" }),
    );
    expect(jwk.kty).toBe("RSA");
  });

  it("rejects invalid JSON and non-objects", () => {
    expect(() => parseArweaveJwk("{")).toThrow(/valid JSON/);
    expect(() => parseArweaveJwk("[]")).toThrow(/JSON object/);
    expect(() => parseArweaveJwk("{}")).toThrow(/kty/);
  });
});
