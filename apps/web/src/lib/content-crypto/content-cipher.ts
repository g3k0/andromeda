import {
  ACE_CIPHERTEXT_FORMAT_VERSION,
  AES_GCM_IV_LENGTH,
  AES_GCM_TAG_LENGTH,
  assertContentKeyLength,
} from "./ace-spec";
import {
  ContentDecryptError,
  InvalidCiphertextError,
  InvalidContentKeyError,
} from "./errors";
import type { Ciphertext, ContentKey } from "./types";

const AES_GCM = "AES-GCM";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function getSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API is not available");
  }
  return subtle;
}

async function importAesKey(key: ContentKey): Promise<CryptoKey> {
  try {
    assertContentKeyLength(key);
  } catch (error) {
    if (error instanceof InvalidContentKeyError) {
      throw error;
    }
    throw new InvalidContentKeyError();
  }

  return getSubtleCrypto().importKey("raw", toArrayBuffer(key), { name: AES_GCM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function parseCiphertextLayout(ciphertext: Ciphertext): {
  iv: Uint8Array;
  encryptedPayload: Uint8Array;
} {
  const minimumLength =
    1 + AES_GCM_IV_LENGTH + AES_GCM_TAG_LENGTH;

  if (ciphertext.length < minimumLength) {
    throw new InvalidCiphertextError("Ciphertext is too short");
  }

  if (ciphertext[0] !== ACE_CIPHERTEXT_FORMAT_VERSION) {
    throw new InvalidCiphertextError("Unsupported ciphertext format version");
  }

  const iv = ciphertext.subarray(1, 1 + AES_GCM_IV_LENGTH);
  const encryptedPayload = ciphertext.subarray(1 + AES_GCM_IV_LENGTH);

  if (encryptedPayload.length < AES_GCM_TAG_LENGTH) {
    throw new InvalidCiphertextError("Missing authentication tag");
  }

  return { iv, encryptedPayload };
}

export async function encryptContent(
  plaintext: Uint8Array,
  key: ContentKey,
): Promise<Ciphertext> {
  const aesKey = await importAesKey(key);
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
  const encryptedPayload = new Uint8Array(
    await getSubtleCrypto().encrypt(
      { name: AES_GCM, iv: toArrayBuffer(iv), tagLength: AES_GCM_TAG_LENGTH * 8 },
      aesKey,
      toArrayBuffer(plaintext),
    ),
  );

  const ciphertext = new Uint8Array(
    1 + AES_GCM_IV_LENGTH + encryptedPayload.length,
  );
  ciphertext[0] = ACE_CIPHERTEXT_FORMAT_VERSION;
  ciphertext.set(iv, 1);
  ciphertext.set(encryptedPayload, 1 + AES_GCM_IV_LENGTH);

  return ciphertext;
}

export async function decryptContent(
  ciphertext: Ciphertext,
  key: ContentKey,
): Promise<Uint8Array> {
  const aesKey = await importAesKey(key);

  let iv: Uint8Array;
  let encryptedPayload: Uint8Array;

  try {
    ({ iv, encryptedPayload } = parseCiphertextLayout(ciphertext));
  } catch (error) {
    if (error instanceof InvalidCiphertextError) {
      throw error;
    }
    throw new InvalidCiphertextError();
  }

  try {
    const plaintext = await getSubtleCrypto().decrypt(
      { name: AES_GCM, iv: toArrayBuffer(iv), tagLength: AES_GCM_TAG_LENGTH * 8 },
      aesKey,
      toArrayBuffer(encryptedPayload),
    );
    return new Uint8Array(plaintext);
  } catch {
    throw new ContentDecryptError();
  }
}

export function encodeUtf8Plaintext(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function decodeUtf8Plaintext(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
