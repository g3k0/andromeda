import { polygon, polygonAmoy } from "viem/chains";
import { afterEach, describe, expect, it } from "vitest";

import { createWagmiTransports } from "./wagmi-transports";

describe("createWagmiTransports", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("configures transports for polygon and polygon Amoy", () => {
    delete process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;

    const transports = createWagmiTransports();

    expect(transports[polygon.id]).toBeDefined();
    expect(transports[polygonAmoy.id]).toBeDefined();
  });

  it("uses the public Alchemy URL when configured", () => {
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL =
      "https://polygon-amoy.g.alchemy.com/v2/test";

    const transports = createWagmiTransports();

    expect(transports[polygon.id]).toBeDefined();
    expect(transports[polygonAmoy.id]).toBeDefined();
  });
});
