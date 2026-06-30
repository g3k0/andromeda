import { describe, expect, it } from "vitest";

import {
  createWorkPublishClientState,
  workPublishClientReducer,
} from "./work-publish-client-state";

describe("workPublishClientReducer", () => {
  it("updates a field and clears its validation error", () => {
    const initial = {
      ...createWorkPublishClientState(),
      errors: { name: "Title is required." },
    };

    const next = workPublishClientReducer(initial, {
      type: "field_change",
      field: "name",
      value: "Novella",
    });

    expect(next.values.name).toBe("Novella");
    expect(next.errors.name).toBeUndefined();
    expect(next.editionPreview).toBeNull();
    expect(next.editionPreviewReady).toBe(false);
  });

  it("stores edition preview and clears it when the manuscript changes", () => {
    const preview = {
      title: "Novella",
      authorLabel: "Jane Doe",
      authorAddress: "0x1111111111111111111111111111111111111111",
      coverImageUrl: "blob:cover",
      colophon: [],
      backCoverText: "Blurb",
      aboutAuthor: "Bio",
      marketplaceDescription: "Blurb",
      manuscript: {
        kind: "text" as const,
        blocks: [],
        tableOfContents: [],
      },
    };

    const ready = workPublishClientReducer(createWorkPublishClientState(), {
      type: "edition_preview_ready",
      preview,
    });

    expect(ready.editionPreviewReady).toBe(true);
    expect(ready.editionPreviewAcknowledged).toBe(false);
    expect(ready.editionPreview?.title).toBe("Novella");

    const acknowledged = workPublishClientReducer(ready, {
      type: "edition_preview_acknowledged_change",
      acknowledged: true,
    });
    expect(acknowledged.editionPreviewAcknowledged).toBe(true);

    const changed = workPublishClientReducer(acknowledged, {
      type: "manuscript_file_change",
      fileName: "other.txt",
    });

    expect(changed.editionPreview).toBeNull();
    expect(changed.editionPreviewReady).toBe(false);
    expect(changed.editionPreviewAcknowledged).toBe(false);
  });

  it("marks upload success and moves to ready", () => {
    const metadata = {
      name: "Novella",
      description: "First edition, edition 1 · published 2026-06-01",
      image: "ipfs://cover",
      work_imprint: {
        publication_date: "2026-06-01",
        edition_number: 1,
        edition_kind: "first" as const,
        back_cover_text: "Encrypted story blurb.",
        about_author: "Author bio.",
        author_address: "0x1111111111111111111111111111111111111111",
      },
      ace: {
        version: "1" as const,
        encrypted_content: "ipfs://content",
        cipher: "aes-256-gcm" as const,
        envelope_scheme: "ecies-secp256k1" as const,
        tba_standard: "erc-6551" as const,
        chain_id: 80002,
        contract: "0x1111111111111111111111111111111111111111",
        registry: "0x2222222222222222222222222222222222222222",
      },
    };

    const next = workPublishClientReducer(createWorkPublishClientState(), {
      type: "upload_success",
      metadata,
    });

    expect(next.step).toBe("ready");
    expect(next.metadataPreview).toEqual(metadata);
  });
});
