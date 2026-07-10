import { decodeUtf8Plaintext } from "@/lib/content-crypto/content-cipher";
import type { TranslateFn } from "@/lib/i18n/translate";
import { buildWorkDescriptionPreviewFromImprint } from "@/lib/i18n/publish-messages";

import { readManuscriptFile } from "./manuscript-upload";
import {
  decodeManuscriptText,
  parseManuscriptTextForPreview,
  type ParsedManuscriptPreview,
} from "./manuscript-text-parser";
import {
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
  t: TranslateFn,
): WorkPublishColophonLine[] {
  const imprint = parseWorkImprintFromFormValues(values, authorAddress);
  const lines: WorkPublishColophonLine[] = [
    {
      label: t("publish.preview.colophon.publicationDate"),
      value: imprint.publication_date,
    },
    {
      label: t("publish.preview.colophon.edition"),
      value: String(imprint.edition_number),
    },
    {
      label: t("publish.preview.colophon.editionKind"),
      value:
        imprint.edition_kind === "first"
          ? t("publish.preview.colophon.firstEdition")
          : t("publish.preview.colophon.reprint"),
    },
  ];

  if (imprint.reprint_number !== undefined) {
    lines.push({
      label: t("publish.preview.colophon.reprintNumber"),
      value: String(imprint.reprint_number),
    });
  }
  if (imprint.original_publication_date) {
    lines.push({
      label: t("publish.preview.colophon.originalPublication"),
      value: imprint.original_publication_date,
    });
  }
  if (imprint.series_name) {
    lines.push({
      label: t("publish.preview.colophon.series"),
      value: imprint.series_name,
    });
    lines.push({
      label: t("publish.preview.colophon.seriesVolume"),
      value: String(imprint.series_volume),
    });
  }
  if (imprint.language) {
    lines.push({
      label: t("publish.preview.colophon.language"),
      value: imprint.language,
    });
  }

  lines.push({
    label: t("publish.preview.colophon.authorAddress"),
    value: imprint.author_address,
  });

  return lines;
}

export async function buildWorkPublishEditionPreview(
  input: BuildWorkPublishEditionPreviewInput,
  t: TranslateFn,
): Promise<WorkPublishEditionPreview> {
  if (!input.manuscriptFile) {
    throw new Error(t("publish.errors.manuscriptRequiredForPreview"));
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
      code: "publish.preview.unsupportedUtf8",
    };
  }

  return {
    title: input.values.name.trim(),
    authorLabel: resolveAuthorLabel(input.authorAddress, input.authorDisplayName),
    authorAddress: input.authorAddress,
    coverImageUrl: input.coverImageUrl ?? null,
    colophon: formatImprintColophon(input.values, input.authorAddress, t),
    backCoverText: imprint.back_cover_text,
    aboutAuthor: imprint.about_author,
    marketplaceDescription: buildWorkDescriptionPreviewFromImprint(imprint, t),
    manuscript,
  };
}

export function decodePreviewManuscriptBytes(bytes: Uint8Array, filename: string): ParsedManuscriptPreview {
  const text = decodeUtf8Plaintext(bytes);
  return parseManuscriptTextForPreview(text, filename);
}
