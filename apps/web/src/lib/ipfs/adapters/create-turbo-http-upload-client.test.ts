import { generateKeyPairSync } from "node:crypto";

import { beforeAll, describe, expect, it, vi } from "vitest";

import { ArweaveUploadError } from "../errors";
import { createTurboHttpUploadClient } from "./create-turbo-http-upload-client";

function generateArweaveJwk(): Record<string, unknown> {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicExponent: 65537,
  });
  return privateKey.export({ format: "jwk" }) as Record<string, unknown>;
}

describe("createTurboHttpUploadClient", () => {
  let jwk: Record<string, unknown>;

  beforeAll(() => {
    jwk = generateArweaveJwk();
  }, 60_000);

  it("signs a data item and POSTs it to Turbo /v1/tx/arweave", async () => {
    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(_input)).toBe("https://upload.ardrive.io/v1/tx/arweave");
        expect(init?.method).toBe("POST");
        expect(init?.headers).toMatchObject({
          "content-type": "application/octet-stream",
        });
        expect(init?.body).toBeInstanceOf(Uint8Array);
        expect((init?.body as Uint8Array).byteLength).toBeGreaterThan(0);
        return new Response(JSON.stringify({ id: "turboTx1", winc: "42" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    );

    const client = createTurboHttpUploadClient({
      jwk,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.upload({
      data: "hello turbo",
      dataItemOpts: {
        tags: [{ name: "Content-Type", value: "text/plain" }],
      },
    });

    expect(result).toEqual({ id: "turboTx1", winc: "42" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("throws ArweaveUploadError on non-OK Turbo response", async () => {
    const client = createTurboHttpUploadClient({
      jwk,
      fetchImpl: (async () =>
        new Response("insufficient balance", { status: 402 })) as typeof fetch,
    });

    await expect(client.upload({ data: "x" })).rejects.toBeInstanceOf(
      ArweaveUploadError,
    );
  });
});
