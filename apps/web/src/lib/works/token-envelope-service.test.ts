import { describe, expect, it } from "vitest";

import { createTbaKeyFixture } from "@/lib/content-crypto/testing/key-fixtures";
import { createInMemoryPermanentStorage } from "@/lib/ipfs/testing/in-memory-permanent-storage";
import { createInMemoryIndexerRepositories } from "@/lib/works/testing/in-memory-indexer-repositories";

import {
  listPendingTokenEnvelopesForAuthor,
  pinTokenEnvelopeForAuthor,
  registerTokenEnvelopeRecipient,
} from "./token-envelope-service";
import { recipientPublicKeyBase64FromBytes } from "./envelope-public-key";
import { wrapContentKey } from "@/lib/content-crypto/envelope";
import { generateContentKey } from "@/lib/content-crypto/ace-spec";

const AUTHOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const BUYER = "0x2222222222222222222222222222222222222222";

describe("token-envelope-service", () => {
  it("registers a recipient and lets the author upload an envelope", async () => {
    const repositories = createInMemoryIndexerRepositories();
    const { storage } = createInMemoryPermanentStorage();
    const recipient = createTbaKeyFixture().publicKey;

    await repositories.works.upsertWork({
      workId: 1n,
      author: AUTHOR,
      metadataURI: "ipfs://meta",
      price: 1n,
      maxCopies: 10n,
      active: true,
    });
    await repositories.tokens.upsertToken({
      tokenId: 42n,
      workId: 1n,
      owner: BUYER,
      copyNumber: 1,
    });

    await registerTokenEnvelopeRecipient(
      repositories,
      42n,
      recipientPublicKeyBase64FromBytes(recipient),
    );

    const envelope = wrapContentKey(generateContentKey(), recipient);
    const pinned = await pinTokenEnvelopeForAuthor(
      repositories,
      storage,
      AUTHOR,
      42n,
      envelope,
    );

    expect(pinned.envelopeUri).toMatch(/^ipfs:\/\//);
    expect(pinned.envelopeCid).toBe(pinned.envelopeUri);
    const token = await repositories.tokens.getToken(42n);
    expect(token?.envelopeCid).toBe(pinned.envelopeUri);
  });

  it("lists pending envelopes for an author", async () => {
    const repositories = createInMemoryIndexerRepositories();
    await repositories.works.upsertWork({
      workId: 2n,
      author: AUTHOR,
      metadataURI: "ipfs://meta-two",
      price: 1n,
      maxCopies: 5n,
      active: true,
    });
    await repositories.tokens.upsertToken({
      tokenId: 7n,
      workId: 2n,
      owner: BUYER,
    });
    await registerTokenEnvelopeRecipient(
      repositories,
      7n,
      recipientPublicKeyBase64FromBytes(createTbaKeyFixture().publicKey),
    );

    const pending = await listPendingTokenEnvelopesForAuthor(repositories, AUTHOR);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.tokenId).toBe(7n);
    expect(pending[0]?.metadataURI).toBe("ipfs://meta-two");
  });
});
