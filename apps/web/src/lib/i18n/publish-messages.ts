import {
  ALLOWED_WORK_MANUSCRIPT_EXTENSIONS,
  MAX_WORK_MANUSCRIPT_MB,
} from "@/lib/works/upload-limits";
import {
  WORK_PUBLISH_MAX_MAX_COPIES,
  WORK_PUBLISH_MIN_MAX_COPIES,
} from "@/lib/works/work-publish-limits";
import { MAX_WORK_COVER_BYTES } from "@/lib/works/upload-limits";
import type { TranslationParams } from "./types";
import type { TranslateFn } from "./translate";

const MAX_WORK_COVER_MB = MAX_WORK_COVER_BYTES / (1024 * 1024);

const MANUSCRIPT_FORMATS_LABEL = ALLOWED_WORK_MANUSCRIPT_EXTENSIONS.map((ext) =>
  ext.slice(1).toUpperCase(),
).join(", ");

export function getPublishIntroGuidance(t: TranslateFn): string {
  return t("publish.guidance.intro");
}

export function getPublishTitleGuidance(t: TranslateFn): string {
  return t("publish.guidance.title");
}

export function getPublishPublicationDateGuidance(t: TranslateFn): string {
  return t("publish.guidance.publicationDate");
}

export function getPublishEditionNumberGuidance(t: TranslateFn): string {
  return t("publish.guidance.editionNumber");
}

export function getPublishEditionKindGuidance(t: TranslateFn): string {
  return t("publish.guidance.editionKind");
}

export function getPublishReprintNumberGuidance(t: TranslateFn): string {
  return t("publish.guidance.reprintNumber");
}

export function getPublishSeriesNameGuidance(t: TranslateFn): string {
  return t("publish.guidance.seriesName");
}

export function getPublishSeriesVolumeGuidance(t: TranslateFn): string {
  return t("publish.guidance.seriesVolume");
}

export function getPublishLanguageGuidance(t: TranslateFn): string {
  return t("publish.guidance.language");
}

export function getPublishOriginalPublicationDateGuidance(t: TranslateFn): string {
  return t("publish.guidance.originalPublicationDate");
}

export function getPublishBackCoverTextGuidance(t: TranslateFn): string {
  return t("publish.guidance.backCoverText");
}

export function getPublishAboutAuthorGuidance(t: TranslateFn): string {
  return t("publish.guidance.aboutAuthor");
}

export function getPublishAuthorAddressGuidance(t: TranslateFn): string {
  return t("publish.guidance.authorAddress");
}

export function getPublishManuscriptGuidance(t: TranslateFn): string {
  return t("publish.guidance.manuscript", {
    formats: MANUSCRIPT_FORMATS_LABEL,
    maxMb: String(MAX_WORK_MANUSCRIPT_MB),
  });
}

export function getPublishCoverGuidance(t: TranslateFn): string {
  return t("publish.guidance.cover", {
    maxMb: String(MAX_WORK_COVER_MB),
  });
}

export function getPublishInitialPriceGuidance(t: TranslateFn): string {
  return t("publish.guidance.initialPrice");
}

export function getPublishMaxCopiesGuidance(t: TranslateFn): string {
  return t("publish.guidance.maxCopies", {
    min: String(WORK_PUBLISH_MIN_MAX_COPIES),
    max: String(WORK_PUBLISH_MAX_MAX_COPIES),
  });
}

export function getPublishExternalUrlGuidance(t: TranslateFn): string {
  return t("publish.guidance.externalUrl");
}

export function translateManuscriptFileError(
  t: TranslateFn,
  error: { code: string; params?: TranslationParams },
): string {
  return t(error.code, error.params);
}

export function getPublishFieldLabel(
  t: TranslateFn,
  field:
    | "publicationDate"
    | "editionNumber"
    | "reprintNumber"
    | "seriesName"
    | "seriesVolume"
    | "language"
    | "originalPublicationDate"
    | "backCoverText"
    | "aboutAuthor",
): string {
  return t(`publish.fields.${field}.label`);
}
