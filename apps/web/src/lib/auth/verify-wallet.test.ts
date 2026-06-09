import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  WalletAuthExpiredError,
  WalletAuthReplayError,
  WalletSignatureInvalidError,
} from "./errors";
import {
  createWalletAuthMessage,
  resetWalletAuthStoreForTests,
  useInMemoryWalletAuthStoreForTests,
  verifyWalletSignature,
} from "./verify-wallet";

const ACCOUNT = privateKeyToAccount(generatePrivateKey());
const OTHER = privateKeyToAccount(generatePrivateKey());

describe("verify-wallet", () => {
  beforeEach(() => {
    useInMemoryWalletAuthStoreForTests();
  });

  afterEach(() => {
    resetWalletAuthStoreForTests();
  });

  it("verifies a valid wallet signature", async () => {
    const { message } = await createWalletAuthMessage(ACCOUNT.address);
    const signature = await ACCOUNT.signMessage({ message });

    await expect(
      verifyWalletSignature({
        address: ACCOUNT.address,
        message,
        signature,
      }),
    ).resolves.toBe(ACCOUNT.address.toLowerCase());
  });

  it("rejects expired messages", async () => {
    const now = Date.now();
    const { message } = await createWalletAuthMessage(ACCOUNT.address, {
      now,
      ttlMs: 1_000,
    });
    const signature = await ACCOUNT.signMessage({ message });

    await expect(
      verifyWalletSignature(
        { address: ACCOUNT.address, message, signature },
        { now: now + 2_000 },
      ),
    ).rejects.toBeInstanceOf(WalletAuthExpiredError);
  });

  it("rejects replayed nonces", async () => {
    const { message } = await createWalletAuthMessage(ACCOUNT.address);
    const signature = await ACCOUNT.signMessage({ message });
    const input = { address: ACCOUNT.address, message, signature };

    await verifyWalletSignature(input);
    await expect(verifyWalletSignature(input)).rejects.toBeInstanceOf(
      WalletAuthReplayError,
    );
  });

  it("rejects signatures from a different wallet", async () => {
    const { message } = await createWalletAuthMessage(ACCOUNT.address);
    const signature = await OTHER.signMessage({ message });

    await expect(
      verifyWalletSignature({
        address: ACCOUNT.address,
        message,
        signature,
      }),
    ).rejects.toBeInstanceOf(WalletSignatureInvalidError);
  });
});
