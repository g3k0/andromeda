import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MemoryStorage,
  getAuthorStoreStorage,
  resetAuthorStoreStorage,
  setAuthorStoreStorage,
} from "./storage";

describe("author store storage", () => {
  afterEach(() => {
    resetAuthorStoreStorage();
  });

  it("uses MemoryStorage for get/set/remove", () => {
    const memory = new MemoryStorage();
    memory.setItem("a", "1");
    expect(memory.getItem("a")).toBe("1");
    memory.removeItem("a");
    expect(memory.getItem("a")).toBeNull();
    memory.setItem("b", "2");
    memory.clear();
    expect(memory.getItem("b")).toBeNull();
  });

  it("uses override storage when configured", () => {
    const override = new MemoryStorage();
    setAuthorStoreStorage(override);
    override.setItem("test-key", "ok");
    expect(getAuthorStoreStorage().getItem("test-key")).toBe("ok");
  });

  it("falls back to server memory when no override and no window", () => {
    resetAuthorStoreStorage();
    const storage = getAuthorStoreStorage();
    storage.setItem("server-key", "value");
    expect(getAuthorStoreStorage().getItem("server-key")).toBe("value");
  });

  it("uses window.localStorage in browser environments", () => {
    const browserStorage = new MemoryStorage();
    const originalWindow = globalThis.window;

    vi.stubGlobal("window", {
      localStorage: browserStorage,
    } as Window & typeof globalThis);

    resetAuthorStoreStorage();
    getAuthorStoreStorage().setItem("browser-key", "browser-value");
    expect(browserStorage.getItem("browser-key")).toBe("browser-value");

    vi.stubGlobal("window", originalWindow);
    resetAuthorStoreStorage();
  });
});
