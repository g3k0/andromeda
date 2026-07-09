import { afterEach, describe, expect, it } from "vitest";
import {
  getAdminAddressesRaw,
  getAlchemyNotifySigningKey,
  getChainIndexerStartBlock,
  getMongoDbUri,
  getServerEnv,
  isChainIndexerEnabled,
  isTrustProxyEnabled,
  resetServerEnvForTests,
} from "./env";

describe("server env config", () => {
  afterEach(() => {
    resetServerEnvForTests();
    delete process.env.CHAIN_INDEXER_ENABLED;
    delete process.env.CHAIN_INDEXER_START_BLOCK;
    delete process.env.ALCHEMY_NOTIFY_SIGNING_KEY;
  });

  it("reads configured environment values", () => {
    process.env.MONGODB_URI = "mongodb://example.test/andromeda";
    process.env.ADMIN_ADDRESSES = "0xabc";
    process.env.TRUST_PROXY = "true";

    expect(getMongoDbUri()).toBe("mongodb://example.test/andromeda");
    expect(getAdminAddressesRaw()).toBe("0xabc");
    expect(isTrustProxyEnabled()).toBe(true);
    expect(getServerEnv().WALLET_SESSION_TTL_MINUTES).toBeUndefined();
  });

  it("parses positive numeric overrides", () => {
    process.env.WALLET_SESSION_TTL_MINUTES = "30";
    process.env.RATE_LIMIT_MAX_REQUESTS = "50";

    expect(getServerEnv().WALLET_SESSION_TTL_MINUTES).toBe(30);
    expect(getServerEnv().RATE_LIMIT_MAX_REQUESTS).toBe(50);
  });

  it("ignores invalid numeric overrides", () => {
    process.env.WALLET_BINDING_TTL_HOURS = "0";
    process.env.AUTH_MESSAGE_RATE_LIMIT = "not-a-number";

    expect(getServerEnv().WALLET_BINDING_TTL_HOURS).toBeUndefined();
    expect(getServerEnv().AUTH_MESSAGE_RATE_LIMIT).toBeUndefined();
  });

  it("reads the chain indexer toggle and start block", () => {
    process.env.CHAIN_INDEXER_ENABLED = "true";
    process.env.CHAIN_INDEXER_START_BLOCK = "1234";

    expect(isChainIndexerEnabled()).toBe(true);
    expect(getChainIndexerStartBlock()).toBe(1234n);
  });

  it("defaults the chain indexer to disabled", () => {
    expect(isChainIndexerEnabled()).toBe(false);
    expect(getChainIndexerStartBlock()).toBeUndefined();
  });

  it("reads the Alchemy Notify signing key and ignores blanks", () => {
    process.env.ALCHEMY_NOTIFY_SIGNING_KEY = "  whsec_abc  ";
    expect(getAlchemyNotifySigningKey()).toBe("whsec_abc");

    resetServerEnvForTests();
    process.env.ALCHEMY_NOTIFY_SIGNING_KEY = "   ";
    expect(getAlchemyNotifySigningKey()).toBeUndefined();
  });
});
