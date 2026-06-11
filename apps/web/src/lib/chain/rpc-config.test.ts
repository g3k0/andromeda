import { polygon, polygonAmoy } from "viem/chains";
import { afterEach, describe, expect, it } from "vitest";

import { AlchemyRpcUrlMissingError } from "./errors";
import {
  getPublicAlchemyRpcUrl,
  getServerAlchemyRpcUrl,
  getTargetChain,
  requirePublicAlchemyRpcUrl,
} from "./rpc-config";

describe("chain rpc-config", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves polygon mainnet when NEXT_PUBLIC_CHAIN is polygon", () => {
    process.env.NEXT_PUBLIC_CHAIN = "polygon";
    expect(getTargetChain()).toBe(polygon);
  });

  it("resolves polygon Amoy when NEXT_PUBLIC_CHAIN is amoy or unset", () => {
    process.env.NEXT_PUBLIC_CHAIN = "amoy";
    expect(getTargetChain()).toBe(polygonAmoy);

    delete process.env.NEXT_PUBLIC_CHAIN;
    expect(getTargetChain()).toBe(polygonAmoy);
  });

  it("reads server Alchemy RPC URL when configured", () => {
    process.env.ALCHEMY_RPC_URL = " https://polygon-amoy.g.alchemy.com/v2/test ";
    expect(getServerAlchemyRpcUrl()).toBe(
      "https://polygon-amoy.g.alchemy.com/v2/test",
    );
  });

  it("throws when server Alchemy RPC URL is missing", () => {
    delete process.env.ALCHEMY_RPC_URL;
    expect(() => getServerAlchemyRpcUrl()).toThrow(AlchemyRpcUrlMissingError);
  });

  it("returns undefined public RPC URL when unset", () => {
    delete process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;
    expect(getPublicAlchemyRpcUrl()).toBeUndefined();
  });

  it("reads public Alchemy RPC URL when configured", () => {
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL =
      "https://polygon-mainnet.g.alchemy.com/v2/public";
    expect(getPublicAlchemyRpcUrl()).toBe(
      "https://polygon-mainnet.g.alchemy.com/v2/public",
    );
  });

  it("requirePublicAlchemyRpcUrl throws when unset", () => {
    delete process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;
    expect(() => requirePublicAlchemyRpcUrl()).toThrow(
      AlchemyRpcUrlMissingError,
    );
  });
});
