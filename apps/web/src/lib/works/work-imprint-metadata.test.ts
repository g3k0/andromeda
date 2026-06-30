import { describe, expect, it } from "vitest";

import {
  buildWorkDescriptionFromImprint,
  createEmptyWorkPublishImprintForm,
  parseWorkImprintFromFormValues,
  validateWorkPublishImprintForm,
  workImprintToAttributes,
} from "./work-imprint-metadata";

const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("work imprint metadata", () => {
  it("validates required imprint fields", () => {
    expect(validateWorkPublishImprintForm(createEmptyWorkPublishImprintForm())).toMatchObject({
      publicationDate: "Publication date is required.",
    });

    expect(
      validateWorkPublishImprintForm({
        ...createEmptyWorkPublishImprintForm(),
        publicationDate: "2026-06-01",
        editionKind: "reprint",
      }).reprintNumber,
    ).toBe("Reprint number is required.");
  });

  it("parses imprint metadata including author address", () => {
    const imprint = parseWorkImprintFromFormValues(
      {
        publicationDate: "2026-06-01",
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
  });

  it("builds a marketplace description and attributes from imprint data", () => {
    const imprint = parseWorkImprintFromFormValues(
      {
        publicationDate: "2026-06-01",
        editionNumber: "1",
        editionKind: "first",
        reprintNumber: "",
        seriesName: "",
        seriesVolume: "",
        language: "",
        originalPublicationDate: "",
      },
      AUTHOR,
    );

    expect(buildWorkDescriptionFromImprint(imprint)).toContain("First edition");
    expect(buildWorkDescriptionFromImprint(imprint)).toContain(AUTHOR);
    expect(workImprintToAttributes(imprint).some((item) => item.trait_type === "Edition kind")).toBe(
      true,
    );
  });
});
