import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  clearWorkContentKey,
  loadWorkContentKey,
  storeWorkContentKey,
} from "./content-key-session";

const METADATA_URI = "ipfs://bafyMetadata";

describe("content-key-session", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  it("stores and loads a content key by metadata URI", () => {
    const key = new Uint8Array([1, 2, 3, 4]);
    storeWorkContentKey(METADATA_URI, key);

    expect(loadWorkContentKey(METADATA_URI)).toEqual(key);
  });

  it("clears a stored content key", () => {
    storeWorkContentKey(METADATA_URI, new Uint8Array([9]));
    clearWorkContentKey(METADATA_URI);
    expect(loadWorkContentKey(METADATA_URI)).toBeNull();
  });
});
