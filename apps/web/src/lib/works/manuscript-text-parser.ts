export type ManuscriptPreviewTocEntry = {
  id: string;
  title: string;
  level: number;
};

export type ManuscriptPreviewBlock =
  | { type: "heading"; id: string; level: number; text: string }
  | { type: "paragraph"; text: string };

export type ParsedManuscriptPreview =
  | {
      kind: "text";
      blocks: ManuscriptPreviewBlock[];
      tableOfContents: ManuscriptPreviewTocEntry[];
    }
  | {
      kind: "unsupported";
      format: string;
      code: string;
    };

const MARKDOWN_HEADING = /^(#{1,6})\s+(.+)$/;
const PLAIN_CHAPTER_HEADING =
  /^(?:chapter|capitolo|part|parte)\s+([\dIVXLC]+)(?:\s*[:.\-–—]\s*(.+))?$/i;

function getNormalizedExtension(filename: string): string {
  const baseName = filename.split(/[/\\]/).pop() ?? filename;
  const dotIndex = baseName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return "";
  }
  return baseName.slice(dotIndex).toLowerCase();
}

function slugifyHeading(text: string, index: number): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `section-${index + 1}`;
}

function pushHeading(
  blocks: ManuscriptPreviewBlock[],
  tableOfContents: ManuscriptPreviewTocEntry[],
  level: number,
  text: string,
  index: number,
): void {
  const id = slugifyHeading(text, index);
  blocks.push({ type: "heading", id, level, text });
  tableOfContents.push({ id, title: text, level });
}

export function parseManuscriptTextForPreview(
  text: string,
  filename: string,
): ParsedManuscriptPreview {
  const extension = getNormalizedExtension(filename);

  if (extension !== ".txt" && extension !== ".md" && extension !== ".markdown") {
    const format = extension ? extension.slice(1).toUpperCase() : "unknown";
    return {
      kind: "unsupported",
      format,
      code: "publish.preview.unsupportedBinaryFormat",
    };
  }

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks: ManuscriptPreviewBlock[] = [];
  const tableOfContents: ManuscriptPreviewTocEntry[] = [];
  let headingIndex = 0;
  let paragraphLines: string[] = [];

  function flushParagraph(): void {
    const paragraph = paragraphLines.join(" ").trim();
    if (paragraph) {
      blocks.push({ type: "paragraph", text: paragraph });
    }
    paragraphLines = [];
  }

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const markdownMatch = trimmed.match(MARKDOWN_HEADING);
    if (markdownMatch) {
      flushParagraph();
      pushHeading(
        blocks,
        tableOfContents,
        markdownMatch[1].length,
        markdownMatch[2].trim(),
        headingIndex,
      );
      headingIndex += 1;
      continue;
    }

    const chapterMatch = trimmed.match(PLAIN_CHAPTER_HEADING);
    if (chapterMatch && extension === ".txt") {
      flushParagraph();
      const chapterTitle = chapterMatch[2]?.trim() || trimmed;
      pushHeading(blocks, tableOfContents, 2, chapterTitle, headingIndex);
      headingIndex += 1;
      continue;
    }

    paragraphLines.push(trimmed);
  }

  flushParagraph();

  return {
    kind: "text",
    blocks,
    tableOfContents,
  };
}

export function decodeManuscriptText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
