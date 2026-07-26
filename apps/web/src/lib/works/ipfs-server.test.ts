import { afterEach, describe, expect, it, vi } from "vitest";

import { createArweaveTurboStorage } from "@/lib/ipfs/adapters/arweave-turbo-storage";
import {
  createFakeTurboUploadClient,
  createFakeTurboUploadState,
} from "@/lib/ipfs/testing/fake-turbo-upload-client";
import { createInMemoryIpfsState, createInMemoryIpfsStorage } from "@/lib/ipfs/testing/in-memory-ipfs-storage";

import {
  getPermanentStorage,
  resetIpfsStorageForTests,
  setIpfsStorageForTests,
  setPermanentStorageForTests,
} from "./ipfs-server";

describe("getPermanentStorage", () => {
  afterEach(() => {
    resetIpfsStorageForTests();
    delete process.env.PERMANENT_STORAGE_BACKEND;
    delete process.env.IPFS_PINNING_API_KEY;
    delete process.env.IPFS_GATEWAY_BASE_URL;
    delete process.env.ARWEAVE_GATEWAY_BASE_URL;
    delete process.env.ARWEAVE_JWK;
    delete process.env.ARWEAVE_TURBO_JWK;
    vi.restoreAllMocks();
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

  it("requires ARWEAVE_JWK when backend is arweave", () => {
    process.env.PERMANENT_STORAGE_BACKEND = "arweave";
    expect(() => getPermanentStorage()).toThrow(/ARWEAVE_JWK/);
  });

  it("uses an injected Arweave permanent storage when set for tests", async () => {
    process.env.PERMANENT_STORAGE_BACKEND = "arweave";
    const state = createFakeTurboUploadState();
    setPermanentStorageForTests(
      createArweaveTurboStorage({
        client: createFakeTurboUploadClient(state),
        gatewayBaseUrl: "https://arweave.test",
      }),
    );

    const storage = getPermanentStorage();
    const uploaded = await storage.uploadJson({ hello: "arweave" });

    expect(uploaded.uri).toBe("ar://fakeTx1");
    expect(storage.toGatewayUrl(uploaded.uri)).toBe(
      "https://arweave.test/fakeTx1",
    );
  });
});
