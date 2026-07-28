import { describe, expect, it, vi } from "vitest";

import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import { unwrapContentKey } from "@/lib/content-crypto/envelope";
import { createTbaKeyFixture } from "@/lib/content-crypto/testing/key-fixtures";
import { getInMemoryIpfsRecord } from "@/lib/ipfs/testing/in-memory-ipfs-storage";
import { createInMemoryPermanentStorage } from "@/lib/ipfs/testing/in-memory-permanent-storage";

import { WorkMintError } from "./errors";
import { createMintEnvelopeFromSession } from "./mint-envelope-client";

const METADATA_URI = "ipfs://bafyMetadata";

describe("createMintEnvelopeFromSession", () => {
  it("wraps the session content key for the resolved TBA pubkey", async () => {
    const { storage, state } = createInMemoryPermanentStorage();
    const contentKey = generateContentKey();
    const tbaKeys = createTbaKeyFixture();
    const resolveRecipientPublicKey = vi.fn().mockResolvedValue(tbaKeys.publicKey);

    const result = await createMintEnvelopeFromSession(
      { storage, loadContentKey: () => contentKey },
      {
        metadataUri: METADATA_URI,
        tokenId: 12n,
        resolveRecipientPublicKey,
      },
    );

    expect(result.reused).toBe(false);
    expect(resolveRecipientPublicKey).toHaveBeenCalledWith({ tokenId: 12n });

    const record = getInMemoryIpfsRecord(state, result.envelopeCid);
    expect(unwrapContentKey(record!.bytes, tbaKeys.privateKey)).toEqual(
      contentKey,
    );
  });

  it("reuses an existing envelope without loading the content key", async () => {
    const { storage, state } = createInMemoryPermanentStorage();
    const loadContentKey = vi.fn();
    const resolveRecipientPublicKey = vi.fn();

    const result = await createMintEnvelopeFromSession(
      { storage, loadContentKey },
      {
        metadataUri: METADATA_URI,
        tokenId: 12n,
        resolveRecipientPublicKey,
        existingEnvelopeUri: "ipfs://bafyExisting",
      },
    );

    expect(result.reused).toBe(true);
    expect(loadContentKey).not.toHaveBeenCalled();
    expect(resolveRecipientPublicKey).not.toHaveBeenCalled();
    expect(state.records.size).toBe(0);
  });

  it("throws when the content key is missing from the session", async () => {
    const { storage } = createInMemoryPermanentStorage();

    await expect(
      createMintEnvelopeFromSession(
        { storage, loadContentKey: () => null },
        {
          metadataUri: METADATA_URI,
          tokenId: 12n,
          resolveRecipientPublicKey: () => createTbaKeyFixture().publicKey,
        },
      ),
    ).rejects.toBeInstanceOf(WorkMintError);
  });
});
