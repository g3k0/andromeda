import { describe, expect, it, vi } from "vitest";

import {
  ArweaveGatewayUnreachableError,
  DEFAULT_ARWEAVE_GATEWAY_URLS,
  fetchBytesWithArweaveFailover,
  fetchWithArweaveFailover,
  parseArweaveGatewayUrls,
  resolveArweaveGatewayUrls,
  toArweaveGatewayHttpsUrl,
} from "./arweave-gateway-resolver";

describe("parseArweaveGatewayUrls", () => {
  it("splits, trims, and deduplicates comma-separated URLs", () => {
    expect(
      parseArweaveGatewayUrls(
        " https://arweave.net/ ,https://ar-io.net,https://arweave.net ",
      ),
    ).toEqual(["https://arweave.net", "https://ar-io.net"]);
  });
});

describe("resolveArweaveGatewayUrls", () => {
  it("falls back to public defaults", () => {
    expect(resolveArweaveGatewayUrls()).toEqual([...DEFAULT_ARWEAVE_GATEWAY_URLS]);
  });

  it("prefers explicit URLs, then primary, then defaults", () => {
    expect(
      resolveArweaveGatewayUrls({
        urls: ["https://primary.test/"],
        primary: "https://secondary.test",
      }),
    ).toEqual([
      "https://primary.test",
      "https://secondary.test",
      ...DEFAULT_ARWEAVE_GATEWAY_URLS,
    ]);
  });
});

describe("toArweaveGatewayHttpsUrl", () => {
  it("builds HTTPS URLs from ar:// and bare ids", () => {
    expect(toArweaveGatewayHttpsUrl("ar://TxId", "https://arweave.net/")).toBe(
      "https://arweave.net/TxId",
    );
    expect(toArweaveGatewayHttpsUrl("TxId", "https://ar-io.net")).toBe(
      "https://ar-io.net/TxId",
    );
  });
});

describe("fetchWithArweaveFailover", () => {
  it("uses the primary gateway when it succeeds", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe("https://gw1.test/MetaTx");
      return new Response("ok", { status: 200 });
    });

    const response = await fetchWithArweaveFailover({
      uriOrId: "ar://MetaTx",
      gatewayUrls: ["https://gw1.test", "https://gw2.test"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await response.text()).toBe("ok");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("fails over to the next gateway when the primary is down", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === "https://gw1.test/MetaTx") {
        throw new TypeError("network down");
      }
      if (url === "https://gw2.test/MetaTx") {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      }
      throw new Error(`unexpected ${url}`);
    });

    const bytes = await fetchBytesWithArweaveFailover({
      uriOrId: "ar://MetaTx",
      gatewayUrls: ["https://gw1.test", "https://gw2.test"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(Array.from(bytes)).toEqual([1, 2, 3]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails over on non-OK HTTP status", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.startsWith("https://gw1.test/")) {
        return new Response("missing", { status: 502 });
      }
      return new Response("recovered", { status: 200 });
    });

    const response = await fetchWithArweaveFailover({
      uriOrId: "MetaTx",
      gatewayUrls: ["https://gw1.test", "https://gw2.test"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(await response.text()).toBe("recovered");
  });

  it("throws when every gateway fails", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 503 }));

    await expect(
      fetchWithArweaveFailover({
        uriOrId: "ar://MetaTx",
        gatewayUrls: ["https://gw1.test", "https://gw2.test"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(ArweaveGatewayUnreachableError);
  });
});
