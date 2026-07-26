import { afterEach, describe, expect, it } from "vitest";

import { createInMemoryIpfsState, createInMemoryIpfsStorage } from "@/lib/ipfs/testing/in-memory-ipfs-storage";

import {
  getPermanentStorage,
  resetIpfsStorageForTests,
  setIpfsStorageForTests,
} from "./ipfs-server";

describe("getPermanentStorage", () => {
  afterEach(() => {
    resetIpfsStorageForTests();
    delete process.env.PERMANENT_STORAGE_BACKEND;
    delete process.env.IPFS_PINNING_API_KEY;
    delete process.env.IPFS_GATEWAY_BASE_URL;
    delete process.env.ARWEAVE_GATEWAY_BASE_URL;
  });

  it("defaults to the Pinata-backed permanent adapter", async () => {
    process.env.IPFS_PINNING_API_KEY = "test-key";
    process.env.IPFS_GATEWAY_BASE_URL = "https://gateway.test/ipfs";
    setIpfsStorageForTests(createInMemoryIpfsStorage(createInMemoryIpfsState()));

    const storage = getPermanentStorage();
    const uploaded = await storage.uploadJson({ hello: "world" });

    expect(uploaded.uri.startsWith("ipfs://")).toBe(true);
    expect(storage.toGatewayUrl(uploaded.uri)).toContain(uploaded.id);
    expect(getPermanentStorage()).toBe(storage);
  });

  it("rejects unsupported backends", () => {
    process.env.PERMANENT_STORAGE_BACKEND = "s3";
    expect(() => getPermanentStorage()).toThrow(/Unsupported PERMANENT_STORAGE_BACKEND/);
  });

  it("rejects arweave until the Turbo adapter lands", () => {
    process.env.PERMANENT_STORAGE_BACKEND = "arweave";
    expect(() => getPermanentStorage()).toThrow(/not implemented yet/);
  });
});
