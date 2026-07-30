import { afterEach, describe, expect, it } from "vitest";

import {
  getArweaveGatewayBaseUrl,
  getArweaveGatewayUrls,
  getContentGatewayBases,
  getIpfsGatewayBaseUrl,
  getIpfsPinningApiKey,
  getPermanentStorageBackend,
  resolvePermanentStorageBackend,
} from "./ipfs-config";

describe("ipfs-config", () => {
  afterEach(() => {
    delete process.env.IPFS_PINNING_API_KEY;
    delete process.env.IPFS_GATEWAY_BASE_URL;
    delete process.env.NEXT_PUBLIC_IPFS_GATEWAY_BASE_URL;
    delete process.env.ARWEAVE_GATEWAY_BASE_URL;
    delete process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY_BASE_URL;
    delete process.env.ARWEAVE_GATEWAY_URLS;
    delete process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY_URLS;
    delete process.env.PERMANENT_STORAGE_BACKEND;
    delete process.env.VERCEL_ENV;
  });

  it("requires a server-only pinning API key", () => {
    expect(() => getIpfsPinningApiKey()).toThrow(/IPFS_PINNING_API_KEY/);

    process.env.IPFS_PINNING_API_KEY = "test-pinning-key";
    expect(getIpfsPinningApiKey()).toBe("test-pinning-key");
  });

  it("resolves the gateway base URL from env with a Pinata default", () => {
    expect(getIpfsGatewayBaseUrl()).toBe("https://gateway.pinata.cloud/ipfs");

    process.env.IPFS_GATEWAY_BASE_URL = "https://ipfs.example.test/";
    expect(getIpfsGatewayBaseUrl()).toBe("https://ipfs.example.test");
  });

  it("defaults permanent storage backend to arweave", () => {
    expect(getPermanentStorageBackend()).toBe("arweave");
    process.env.PERMANENT_STORAGE_BACKEND = "Pinata";
    expect(getPermanentStorageBackend()).toBe("pinata");
  });

  it("forces arweave on Vercel Preview even when pinata is configured", () => {
    expect(
      resolvePermanentStorageBackend({
        configured: "pinata",
        vercelEnv: "preview",
      }),
    ).toBe("arweave");
  });

  it("rejects unsupported permanent storage backends", () => {
    expect(() =>
      resolvePermanentStorageBackend({ configured: "s3" }),
    ).toThrow(/Unsupported PERMANENT_STORAGE_BACKEND/);
  });

  it("resolves the Arweave gateway with a public default", () => {
    expect(getArweaveGatewayBaseUrl()).toBe("https://arweave.net");
    process.env.ARWEAVE_GATEWAY_BASE_URL = "https://ar.example.test/";
    expect(getArweaveGatewayBaseUrl()).toBe("https://ar.example.test");
  });

  it("builds an Arweave failover list from ARWEAVE_GATEWAY_URLS", () => {
    process.env.ARWEAVE_GATEWAY_URLS = "https://gw1.test/,https://gw2.test";
    expect(getArweaveGatewayUrls()).toEqual([
      "https://gw1.test",
      "https://gw2.test",
      "https://arweave.net",
      "https://ar-io.net",
    ]);
  });

  it("pairs IPFS and Arweave gateways for content URI resolution", () => {
    process.env.IPFS_GATEWAY_BASE_URL = "https://ipfs.example.test/";
    process.env.ARWEAVE_GATEWAY_BASE_URL = "https://ar.example.test/";
    expect(getContentGatewayBases()).toEqual({
      ipfs: "https://ipfs.example.test",
      arweave: "https://ar.example.test",
      arweaveUrls: [
        "https://ar.example.test",
        "https://arweave.net",
        "https://ar-io.net",
      ],
    });
  });
});
