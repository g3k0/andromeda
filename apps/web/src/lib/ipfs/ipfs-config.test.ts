import { describe, expect, it } from "vitest";

import { getIpfsGatewayBaseUrl, getIpfsPinningApiKey } from "./ipfs-config";

describe("ipfs-config", () => {
  it("requires a server-only pinning API key", () => {
    delete process.env.IPFS_PINNING_API_KEY;
    expect(() => getIpfsPinningApiKey()).toThrow(/IPFS_PINNING_API_KEY/);

    process.env.IPFS_PINNING_API_KEY = "test-pinning-key";
    expect(getIpfsPinningApiKey()).toBe("test-pinning-key");
  });

  it("resolves the gateway base URL from env with a Pinata default", () => {
    delete process.env.IPFS_GATEWAY_BASE_URL;
    delete process.env.NEXT_PUBLIC_IPFS_GATEWAY_BASE_URL;
    expect(getIpfsGatewayBaseUrl()).toBe("https://gateway.pinata.cloud/ipfs");

    process.env.IPFS_GATEWAY_BASE_URL = "https://ipfs.example.test/";
    expect(getIpfsGatewayBaseUrl()).toBe("https://ipfs.example.test");
  });
});
