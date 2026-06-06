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

const AUTH_MESSAGE_PREFIX = "Andromeda wants you to sign in with your wallet.";
const DEFAULT_TTL_MS = 5 * 60 * 1000;

type StoredNonce = {
  address: string;
  expiresAt: number;
  used: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var walletAuthNonceStore: Map<string, StoredNonce> | undefined;
}

function getNonceStore(): Map<string, StoredNonce> {
  if (!global.walletAuthNonceStore) {
    global.walletAuthNonceStore = new Map();
  }
  return global.walletAuthNonceStore;
}

export type WalletSignatureInput = {
  address: string;
  message: string;
  signature: `0x${string}`;
};

export function createWalletAuthMessage(
  address: string,
  options?: { now?: number; ttlMs?: number },
): { message: string; nonce: string; expiresAt: number } {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new WalletAuthMessageInvalidError();
  }

  const now = options?.now ?? Date.now();
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = now + ttlMs;
  const nonce = randomUUID();
  const message = [
    AUTH_MESSAGE_PREFIX,
    "",
    `Address: ${normalized}`,
    `Nonce: ${nonce}`,
    `Expires: ${new Date(expiresAt).toISOString()}`,
  ].join("\n");

  getNonceStore().set(nonce, {
    address: normalized,
    expiresAt,
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
  getNonceStore().clear();
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

  const stored = getNonceStore().get(parsed.nonce);
  if (!stored || stored.address !== parsed.address || stored.used) {
    throw new WalletAuthReplayError();
  }

  const valid = await verifyMessage({
    address: parsed.address as `0x${string}`,
    message: input.message,
    signature: input.signature,
  });

  if (!valid) {
    throw new WalletSignatureInvalidError();
  }

  stored.used = true;
  return parsed.address;
}
