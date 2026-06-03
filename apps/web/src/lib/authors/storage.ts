export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export class MemoryStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

let overrideStorage: KeyValueStorage | null = null;
const serverMemory = new MemoryStorage();

export function setAuthorStoreStorage(storage: KeyValueStorage | null): void {
  overrideStorage = storage;
}

export function getAuthorStoreStorage(): KeyValueStorage {
  if (overrideStorage) {
    return overrideStorage;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return serverMemory;
}

export function resetAuthorStoreStorage(): void {
  overrideStorage = null;
  serverMemory.clear();
}
