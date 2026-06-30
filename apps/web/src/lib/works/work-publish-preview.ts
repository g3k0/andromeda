import { decodeUtf8Plaintext } from "@/lib/content-crypto/content-cipher";

import { readManuscriptFile } from "./manuscript-upload";
import {
  decodeManuscriptText,
  parseManuscriptTextForPreview,
  type ParsedManuscriptPreview,
} from "./manuscript-text-parser";
import {
  buildWorkDescriptionFromImprint,
  parseWorkImprintFromFormValues,
} from "./work-imprint-metadata";
import type { WorkPublishFormValues } from "./work-publish-form-state";

export type WorkPublishColophonLine = {
  label: string;
  value: string;
};

export type WorkPublishEditionPreview = {
  title: string;
  authorLabel: string;
  authorAddress: string;
  coverImageUrl: string | null;
  colophon: WorkPublishColophonLine[];
  backCoverText: string;
  aboutAuthor: string;
  marketplaceDescription: string;
  manuscript: ParsedManuscriptPreview;
};

export type BuildWorkPublishEditionPreviewInput = {
  values: WorkPublishFormValues;
  authorAddress: string;
  authorDisplayName?: string | null;
  coverImage: File | null;
  manuscriptFile: File | null;
  coverImageUrl?: string | null;
};

function resolveAuthorLabel(
  authorAddress: string,
  authorDisplayName?: string | null,
): string {
  const trimmedName = authorDisplayName?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  return `${authorAddress.slice(0, 6)}…${authorAddress.slice(-4)}`;
}

export function formatImprintColophon(
  values: WorkPublishFormValues,
  authorAddress: string,
): WorkPublishColophonLine[] {
  const imprint = parseWorkImprintFromFormValues(values, authorAddress);
  const lines: WorkPublishColophonLine[] = [
    { label: "Publication date", value: imprint.publication_date },
    { label: "Edition", value: String(imprint.edition_number) },
    {
      label: "Edition kind",
      value: imprint.edition_kind === "first" ? "First edition" : "Reprint",
    },
  ];

  if (imprint.reprint_number !== undefined) {
    lines.push({ label: "Reprint number", value: String(imprint.reprint_number) });
  }
  if (imprint.original_publication_date) {
    lines.push({
      label: "Original publication",
      value: imprint.original_publication_date,
    });
  }
  if (imprint.series_name) {
    lines.push({ label: "Series", value: imprint.series_name });
    lines.push({ label: "Series volume", value: String(imprint.series_volume) });
  }
  if (imprint.language) {
    lines.push({ label: "Language", value: imprint.language });
  }

  lines.push({ label: "Author address", value: imprint.author_address });

  return lines;
}

export async function buildWorkPublishEditionPreview(
  input: BuildWorkPublishEditionPreviewInput,
): Promise<WorkPublishEditionPreview> {
  if (!input.manuscriptFile) {
    throw new Error("Manuscript file is required for preview.");
  }

  const manuscriptBytes = await readManuscriptFile(input.manuscriptFile);
  const imprint = parseWorkImprintFromFormValues(input.values, input.authorAddress);
  let manuscript: ParsedManuscriptPreview;

  try {
    const text = decodeManuscriptText(manuscriptBytes);
    manuscript = parseManuscriptTextForPreview(text, input.manuscriptFile.name);
  } catch {
    manuscript = {
      kind: "unsupported",
      format: input.manuscriptFile.name.split(".").pop()?.toUpperCase() ?? "unknown",
      message:
        "This manuscript could not be decoded as UTF-8 text for preview. It will still be encrypted and uploaded unchanged.",
    };
  }

  return {
    title: input.values.name.trim(),
    authorLabel: resolveAuthorLabel(input.authorAddress, input.authorDisplayName),
    authorAddress: input.authorAddress,
    coverImageUrl: input.coverImageUrl ?? null,
    colophon: formatImprintColophon(input.values, input.authorAddress),
    backCoverText: imprint.back_cover_text,
    aboutAuthor: imprint.about_author,
    marketplaceDescription: buildWorkDescriptionFromImprint(imprint),
    manuscript,
  };
}

export function decodePreviewManuscriptBytes(bytes: Uint8Array, filename: string): ParsedManuscriptPreview {
  const text = decodeUtf8Plaintext(bytes);
  return parseManuscriptTextForPreview(text, filename);
}
