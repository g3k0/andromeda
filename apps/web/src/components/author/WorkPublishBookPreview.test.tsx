/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkPublishBookPreview } from "./WorkPublishBookPreview";
import type { WorkPublishEditionPreview } from "@/lib/works/work-publish-preview";

const preview: WorkPublishEditionPreview = {
  title: "The Star Gate",
  authorLabel: "Jane Doe",
  authorAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
  coverImageUrl: null,
  colophon: [
    { label: "Publication date", value: "2026-06-01" },
    { label: "Edition kind", value: "First edition" },
  ],
  backCoverText: "A distant gate opens.",
  aboutAuthor: "Jane Doe writes science fiction.",
  marketplaceDescription: "A distant gate opens.\n\nFirst edition, edition 1 · published 2026-06-01",
  manuscript: {
    kind: "text",
    tableOfContents: [{ id: "chapter-1", title: "Chapter 1", level: 1 }],
    blocks: [
      { type: "heading", id: "chapter-1", level: 1, text: "Chapter 1" },
      { type: "paragraph", text: "Once upon a time." },
    ],
  },
};

describe("WorkPublishBookPreview", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders cover, colophon, table of contents, and back matter", () => {
    render(<WorkPublishBookPreview preview={preview} />);

    expect(screen.getByLabelText(/Edition preview/i)).toBeInTheDocument();
    expect(screen.getAllByText("The Star Gate").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
    expect(screen.getByText("Table of contents")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chapter 1" })).toBeInTheDocument();
    expect(screen.getByText("A distant gate opens.")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe writes science fiction.")).toBeInTheDocument();
  });
});
