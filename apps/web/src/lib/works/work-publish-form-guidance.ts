import { getWorkManuscriptUploadGuidance } from "./manuscript-upload-guidance";
import {
  getWorkPublishInitialPriceGuidance,
} from "./work-publish-pricing-guidance";
import {
  WORK_PUBLISH_MAX_MAX_COPIES,
  WORK_PUBLISH_MIN_MAX_COPIES,
} from "./work-publish-limits";
import { MAX_WORK_COVER_BYTES } from "./upload-limits";

const MAX_WORK_COVER_MB = MAX_WORK_COVER_BYTES / (1024 * 1024);

export const WORK_PUBLISH_FORM_GUIDANCE = {
  intro:
    "Upload your manuscript and cover, then encrypt and pin the work to IPFS before on-chain registration.",
  title: "Public title shown in metadata and on marketplaces.",
  publicationDate: "Date this edition was published (colophon publication date).",
  editionNumber:
    "Number of this edition (for example, 1 for the first numbered edition).",
  editionKind:
    "Whether this is the first edition or a later reprint of the same edition number.",
  reprintNumber:
    "Which reprint this is when the edition kind is reprint (for example, 2 for the second reprint).",
  seriesName: "Name of the series or collection, if the work belongs to one.",
  seriesVolume: "Volume number within the series or collection.",
  language:
    "Optional language code or name (for example, en or Italian) for catalogue listings.",
  originalPublicationDate:
    "Optional date of first publication when this edition was published later.",
  authorAddress:
    "Your public wallet address, stored in metadata as the certified author identity.",
  manuscript: getWorkManuscriptUploadGuidance(),
  cover: `Cover image for metadata and listings. Allowed formats: PNG, JPEG, WebP. Maximum size: ${MAX_WORK_COVER_MB} MB.`,
  initialPrice: getWorkPublishInitialPriceGuidance(),
  maxCopies: `Numbered copies to mint (${WORK_PUBLISH_MIN_MAX_COPIES}–${WORK_PUBLISH_MAX_MAX_COPIES}). Each minted copy is a numbered NFT; collectors may value copies differently—for example, copy #1 versus copy #145.`,
  externalUrl:
    "Optional public link included in metadata, such as your author website.",
} as const;
