import "server-only";

import { randomUUID } from "node:crypto";
import { verifyMessage } from "viem";
import { normalizeAddress } from "@/lib/authors/address";
import {
  WalletAuthExpiredError,
  WalletAuthMessageInvalidError,
  WalletAuthReplayError,
  WalletSignatureInvalidError,
} from "./errors";
import {
  AUTH_MESSAGE_PREFIX,
  getWalletAuthNonceTtlMs,
} from "@/lib/config/auth";
import {
  getWalletAuthNonceStore,
  resetWalletAuthNonceStoreForTests,
  useInMemoryWalletAuthNonceStoreForTests,
} from "./wallet-auth-nonce-server";

export type WalletSignatureInput = {
  address: string;
  message: string;
  signature: `0x${string}`;
};

export async function createWalletAuthMessage(
  address: string,
  options?: { now?: number; ttlMs?: number },
): Promise<{ message: string; nonce: string; expiresAt: number }> {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new WalletAuthMessageInvalidError();
  }

  const now = options?.now ?? Date.now();
  const ttlMs = options?.ttlMs ?? getWalletAuthNonceTtlMs();
  const expiresAt = now + ttlMs;
  const nonce = randomUUID();
  const message = [
    AUTH_MESSAGE_PREFIX,
    "",
    `Address: ${normalized}`,
    `Nonce: ${nonce}`,
    `Expires: ${new Date(expiresAt).toISOString()}`,
  ].join("\n");

  const store = await getWalletAuthNonceStore();
  await store.put({
    nonce,
    address: normalized,
    expiresAt: new Date(expiresAt),
    used: false,
  });

  return { message, nonce, expiresAt };
}

function parseWalletAuthMessage(message: string): {
  address: string;
  nonce: string;
  expiresAt: number;
} {
  const lines = message.split("\n");
  if (lines[0] !== AUTH_MESSAGE_PREFIX) {
    throw new WalletAuthMessageInvalidError();
  }

  const addressLine = lines.find((line) => line.startsWith("Address: "));
  const nonceLine = lines.find((line) => line.startsWith("Nonce: "));
  const expiresLine = lines.find((line) => line.startsWith("Expires: "));

  if (!addressLine || !nonceLine || !expiresLine) {
    throw new WalletAuthMessageInvalidError();
  }

  const address = normalizeAddress(addressLine.replace("Address: ", ""));
  const nonce = nonceLine.replace("Nonce: ", "").trim();
  const expiresAt = Date.parse(expiresLine.replace("Expires: ", "").trim());

  if (!address || !nonce || Number.isNaN(expiresAt)) {
    throw new WalletAuthMessageInvalidError();
  }

  return { address, nonce, expiresAt };
}

/** @internal Resets nonce cache between tests. */
export function resetWalletAuthStoreForTests(): void {
  resetWalletAuthNonceStoreForTests();
}

/** @internal Uses in-memory nonce store for unit tests. */
export function useInMemoryWalletAuthStoreForTests(): void {
  useInMemoryWalletAuthNonceStoreForTests();
}

export async function verifyWalletSignature(
  input: WalletSignatureInput,
  options?: { now?: number },
): Promise<string> {
  const parsed = parseWalletAuthMessage(input.message);
  const normalizedInput = normalizeAddress(input.address);

  if (!normalizedInput || normalizedInput !== parsed.address) {
    throw new WalletSignatureInvalidError();
  }

  const now = options?.now ?? Date.now();
  if (parsed.expiresAt < now) {
    throw new WalletAuthExpiredError();
  }

  const valid = await verifyMessage({
    address: parsed.address as `0x${string}`,
    message: input.message,
    signature: input.signature,
  });

  if (!valid) {
    throw new WalletSignatureInvalidError();
  }

  const store = await getWalletAuthNonceStore();
  const consumed = await store.consumeIfValid(
    parsed.nonce,
    parsed.address,
    new Date(now),
  );
  if (!consumed) {
    throw new WalletAuthReplayError();
  }

  return parsed.address;
}
