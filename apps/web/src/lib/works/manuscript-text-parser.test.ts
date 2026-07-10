import { describe, expect, it } from "vitest";

import {
  decodeManuscriptText,
  parseManuscriptTextForPreview,
} from "./manuscript-text-parser";

describe("parseManuscriptTextForPreview", () => {
  it("builds a table of contents from markdown headings", () => {
    const parsed = parseManuscriptTextForPreview(
      `# Prologue\n\nOnce upon a time.\n\n## Chapter 1\n\nThe gate opens.`,
      "novel.md",
    );

    expect(parsed.kind).toBe("text");
    if (parsed.kind !== "text") {
      return;
    }

    expect(parsed.tableOfContents).toEqual([
      { id: "prologue", title: "Prologue", level: 1 },
      { id: "chapter-1", title: "Chapter 1", level: 2 },
    ]);
    expect(parsed.blocks).toHaveLength(4);
  });

  it("detects chapter headings in plain text manuscripts", () => {
    const parsed = parseManuscriptTextForPreview(
      "Chapter 1: The gate\n\nBody text.\n\nCapitolo 2 — La porta",
      "novel.txt",
    );

    expect(parsed.kind).toBe("text");
    if (parsed.kind !== "text") {
      return;
    }

    expect(parsed.tableOfContents.map((entry) => entry.title)).toEqual([
      "The gate",
      "La porta",
    ]);
  });

  it("marks binary manuscript formats as unsupported for preview", () => {
    const parsed = parseManuscriptTextForPreview("", "novel.pdf");

    expect(parsed).toEqual({
      kind: "unsupported",
      format: "PDF",
      code: "publish.preview.unsupportedBinaryFormat",
    });
  });
});

describe("decodeManuscriptText", () => {
  it("decodes valid UTF-8 manuscript bytes", () => {
    expect(decodeManuscriptText(new TextEncoder().encode("Ciao"))).toBe("Ciao");
  });
});
