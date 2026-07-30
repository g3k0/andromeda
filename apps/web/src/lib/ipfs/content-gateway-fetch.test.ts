import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ArweaveGatewayUnreachableError,
  fetchContentBytesFromGateways,
  fetchContentFromGateways,
} from "./content-gateway-fetch";

const GATEWAYS = {
  ipfs: "https://gateway.test/ipfs",
  arweave: "https://gw1.test",
  arweaveUrls: ["https://gw1.test", "https://gw2.test"],
};

describe("fetchContentFromGateways", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches ipfs:// via the single IPFS gateway", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe("https://gateway.test/ipfs/bafymeta");
      return new Response("ok", { status: 200 });
    });

    const response = await fetchContentFromGateways({
      uriOrId: "ipfs://bafymeta",
      gateways: GATEWAYS,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await response.text()).toBe("ok");
  });

  it("fails over ar:// across Arweave gateways", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === "https://gw1.test/MetaTx") {
        return new Response("down", { status: 502 });
      }
      return new Response(new Uint8Array([4, 5]), { status: 200 });
    });

    const bytes = await fetchContentBytesFromGateways({
      uriOrId: "ar://MetaTx",
      gateways: GATEWAYS,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(Array.from(bytes)).toEqual([4, 5]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("surfaces ArweaveGatewayUnreachableError when all Arweave gateways fail", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 503 }));

    await expect(
      fetchContentFromGateways({
        uriOrId: "ar://MetaTx",
        gateways: GATEWAYS,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(ArweaveGatewayUnreachableError);
  });
});
