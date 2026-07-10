import { describe, expect, it } from "vitest";
import { createTranslateFn } from "@/lib/i18n/translate";

import {
  buildWorkDescriptionFromImprint,
  createEmptyWorkPublishImprintForm,
  parseWorkImprintFromFormValues,
  validateWorkPublishImprintForm,
  workImprintToAttributes,
} from "./work-imprint-metadata";

const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";
const t = createTranslateFn("en");

const SAMPLE_IMPRINT_FORM = {
  publicationDate: "2026-06-01",
  editionNumber: "1",
  editionKind: "first" as const,
  reprintNumber: "",
  seriesName: "",
  seriesVolume: "",
  language: "",
  originalPublicationDate: "",
  backCoverText: "A gripping tale of stars and gates.",
  aboutAuthor: "Jane Doe writes science fiction.",
};

describe("work imprint metadata", () => {
  it("validates required imprint fields", () => {
    expect(validateWorkPublishImprintForm(createEmptyWorkPublishImprintForm(), t)).toMatchObject({
      publicationDate: "Publication date is required.",
      backCoverText: "Back cover text is required.",
      aboutAuthor: "About the author is required.",
    });

    expect(
      validateWorkPublishImprintForm({
        ...createEmptyWorkPublishImprintForm(),
        publicationDate: "2026-06-01",
        editionKind: "reprint",
        backCoverText: "Blurb.",
        aboutAuthor: "Bio.",
      }, t).reprintNumber,
    ).toBe("Reprint number is required.");
  });

  it("parses imprint metadata including author address", () => {
    const imprint = parseWorkImprintFromFormValues(
      {
        ...SAMPLE_IMPRINT_FORM,
        editionNumber: "2",
        editionKind: "reprint",
        reprintNumber: "3",
        seriesName: "Andromeda Tales",
        seriesVolume: "4",
        language: "it",
        originalPublicationDate: "2024-01-01",
      },
      AUTHOR,
    );

    expect(imprint.author_address).toBe(AUTHOR);
    expect(imprint.series_name).toBe("Andromeda Tales");
    expect(imprint.reprint_number).toBe(3);
    expect(imprint.back_cover_text).toBe("A gripping tale of stars and gates.");
    expect(imprint.about_author).toBe("Jane Doe writes science fiction.");
  });

  it("builds a marketplace description and attributes from imprint data", () => {
    const imprint = parseWorkImprintFromFormValues(SAMPLE_IMPRINT_FORM, AUTHOR);

    expect(buildWorkDescriptionFromImprint(imprint)).toContain("A gripping tale");
    expect(buildWorkDescriptionFromImprint(imprint)).toContain("First edition");
    expect(buildWorkDescriptionFromImprint(imprint)).toContain(AUTHOR);
    expect(workImprintToAttributes(imprint).some((item) => item.trait_type === "Edition kind")).toBe(
      true,
    );
  });
});
