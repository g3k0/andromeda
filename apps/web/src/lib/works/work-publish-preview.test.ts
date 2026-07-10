import { describe, expect, it } from "vitest";
import { createTranslateFn } from "@/lib/i18n/translate";

import {
  buildWorkPublishEditionPreview,
  formatImprintColophon,
} from "./work-publish-preview";
import { createEmptyWorkPublishForm } from "./work-publish-form-state";

const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";
const t = createTranslateFn("en");

function validFormValues() {
  return {
    ...createEmptyWorkPublishForm(),
    name: "The Star Gate",
    publicationDate: "2026-06-01",
    editionNumber: "1",
    editionKind: "first" as const,
    backCoverText: "A science-fiction novella about distant gates.",
    aboutAuthor: "Jane Doe writes speculative fiction.",
  };
}

describe("formatImprintColophon", () => {
  it("formats imprint metadata as colophon lines", () => {
    expect(formatImprintColophon(validFormValues(), AUTHOR, t)).toEqual([
      { label: "Publication date", value: "2026-06-01" },
      { label: "Edition", value: "1" },
      { label: "Edition kind", value: "First edition" },
      { label: "Author address", value: AUTHOR },
    ]);
  });
});

describe("buildWorkPublishEditionPreview", () => {
  it("builds a full edition preview from form values and manuscript text", async () => {
    const manuscript = new File(
      [new TextEncoder().encode("# Chapter 1\n\nOnce upon a time.")],
      "novel.md",
      { type: "text/markdown" },
    );

    const preview = await buildWorkPublishEditionPreview({
      values: validFormValues(),
      authorAddress: AUTHOR,
      authorDisplayName: "Jane Doe",
      coverImage: null,
      manuscriptFile: manuscript,
      coverImageUrl: "blob:cover",
    }, t);

    expect(preview.title).toBe("The Star Gate");
    expect(preview.authorLabel).toBe("Jane Doe");
    expect(preview.coverImageUrl).toBe("blob:cover");
    expect(preview.manuscript.kind).toBe("text");
    if (preview.manuscript.kind === "text") {
      expect(preview.manuscript.tableOfContents[0]?.title).toBe("Chapter 1");
    }
    expect(preview.marketplaceDescription).toContain("A science-fiction novella");
  });
});
