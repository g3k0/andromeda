import type { StoredWorkContentKey } from "./types";

const STORAGE_KEY_PREFIX = "andromeda:work-content-key:";

function storageKey(metadataUri: string): string {
  return `${STORAGE_KEY_PREFIX}${metadataUri}`;
}

/** Persists the symmetric content key locally for PR7 mint envelopes — never sent to the server. */
export function storeWorkContentKey(
  metadataUri: string,
  contentKey: Uint8Array,
): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  const payload: StoredWorkContentKey = {
    metadataUri,
    contentKeyBase64: bytesToBase64(contentKey),
    storedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(storageKey(metadataUri), JSON.stringify(payload));
}

export function loadWorkContentKey(metadataUri: string): Uint8Array | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(storageKey(metadataUri));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredWorkContentKey;
    if (parsed.metadataUri !== metadataUri) {
      return null;
    }
    return base64ToBytes(parsed.contentKeyBase64);
  } catch {
    return null;
  }
}

export function clearWorkContentKey(metadataUri: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.removeItem(storageKey(metadataUri));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
