import { polygonAmoy } from "viem/chains";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AlchemyRpcUrlMissingError } from "./errors";
import { createAndromedaPublicClient } from "./public-client";

describe("createAndromedaPublicClient", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("creates a public client for the configured chain", () => {
    process.env.NEXT_PUBLIC_CHAIN = "amoy";
    process.env.ALCHEMY_RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/test";

    const client = createAndromedaPublicClient();

    expect(client.chain).toBe(polygonAmoy);
    expect(client.transport).toBeDefined();
  });

  it("throws when server Alchemy RPC URL is missing", () => {
    delete process.env.ALCHEMY_RPC_URL;

    expect(() => createAndromedaPublicClient()).toThrow(
      AlchemyRpcUrlMissingError,
    );
  });
});
