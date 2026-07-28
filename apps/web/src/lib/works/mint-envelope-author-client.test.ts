import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTbaKeyFixture } from "@/lib/content-crypto/testing/key-fixtures";
import { recipientPublicKeyBase64FromBytes } from "./envelope-public-key";

const {
  createSignedWalletPayload,
  fetchPendingEnvelopesForAuthor,
  loadWorkContentKey,
  uploadTokenEnvelopeForAuthor,
} = vi.hoisted(() => ({
  createSignedWalletPayload: vi.fn(),
  fetchPendingEnvelopesForAuthor: vi.fn(),
  loadWorkContentKey: vi.fn(),
  uploadTokenEnvelopeForAuthor: vi.fn(),
}));

vi.mock("@/lib/auth/client-wallet-auth", () => ({
  createSignedWalletPayload,
}));

vi.mock("./mint-envelope-api-client", () => ({
  fetchPendingEnvelopesForAuthor,
  uploadTokenEnvelopeForAuthor,
}));

vi.mock("./content-key-session", () => ({
  loadWorkContentKey,
}));

import { provisionAllPendingEnvelopesForAuthor } from "./mint-envelope-author-client";

const AUTHOR = "0x1111111111111111111111111111111111111111" as const;
const METADATA_URI = "ipfs://metadata";
const RECIPIENT_PUBLIC_KEY = recipientPublicKeyBase64FromBytes(
  createTbaKeyFixture().publicKey,
);
const WALLET_AUTH = {
  address: AUTHOR,
  message: "Sign in",
  signature: "0xabc" as const,
};

describe("provisionAllPendingEnvelopesForAuthor", () => {
  beforeEach(() => {
    createSignedWalletPayload.mockReset();
    fetchPendingEnvelopesForAuthor.mockReset();
    loadWorkContentKey.mockReset();
    uploadTokenEnvelopeForAuthor.mockReset();

    createSignedWalletPayload.mockResolvedValue(WALLET_AUTH);
    uploadTokenEnvelopeForAuthor.mockResolvedValue({
      envelopeCid: "ar://bafy-envelope",
      envelopeUri: "ar://bafy-envelope",
    });
  });

  it("does not request wallet auth when there are no pending envelopes", async () => {
    fetchPendingEnvelopesForAuthor.mockResolvedValue([]);

    const signMessageAsync = vi.fn();

    await expect(
      provisionAllPendingEnvelopesForAuthor({
        authorAddress: AUTHOR,
        address: AUTHOR,
        signMessageAsync,
      }),
    ).resolves.toEqual([]);

    expect(createSignedWalletPayload).not.toHaveBeenCalled();
    expect(signMessageAsync).not.toHaveBeenCalled();
  });

  it("does not request wallet auth when pending envelopes lack session content keys", async () => {
    fetchPendingEnvelopesForAuthor.mockResolvedValue([
      {
        tokenId: 1n,
        workId: 10n,
        metadataURI: METADATA_URI,
        recipientPublicKeyBase64: RECIPIENT_PUBLIC_KEY,
      },
    ]);
    loadWorkContentKey.mockReturnValue(null);

    const signMessageAsync = vi.fn();

    await expect(
      provisionAllPendingEnvelopesForAuthor({
        authorAddress: AUTHOR,
        address: AUTHOR,
        signMessageAsync,
      }),
    ).resolves.toEqual([]);

    expect(createSignedWalletPayload).not.toHaveBeenCalled();
    expect(signMessageAsync).not.toHaveBeenCalled();
  });

  it("signs once and uploads when pending envelopes can be provisioned", async () => {
    fetchPendingEnvelopesForAuthor.mockResolvedValue([
      {
        tokenId: 1n,
        workId: 10n,
        metadataURI: METADATA_URI,
        recipientPublicKeyBase64: RECIPIENT_PUBLIC_KEY,
      },
    ]);
    loadWorkContentKey.mockReturnValue(new Uint8Array(32).fill(7));

    const signMessageAsync = vi.fn();

    await expect(
      provisionAllPendingEnvelopesForAuthor({
        authorAddress: AUTHOR,
        address: AUTHOR,
        signMessageAsync,
      }),
    ).resolves.toEqual([
      { tokenId: 1n, envelopeUri: "ar://bafy-envelope" },
    ]);

    expect(createSignedWalletPayload).toHaveBeenCalledWith(AUTHOR, signMessageAsync);
    expect(uploadTokenEnvelopeForAuthor).toHaveBeenCalledTimes(1);
  });
});
