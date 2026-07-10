import { describe, expect, it } from "vitest";

import { buildLocalizedPageMetadata } from "./page-metadata";

describe("buildLocalizedPageMetadata", () => {
  it("returns translated title description and hreflang alternates", () => {
    const metadata = buildLocalizedPageMetadata(
      "en",
      "/works",
      "meta.catalog.title",
      "meta.catalog.description",
    );

    expect(metadata).toMatchObject({
      title: "Catalog | Andromeda",
      description: "Browse author-certified literary editions on Andromeda.",
      alternates: {
        canonical: "/en/works",
        languages: {
          en: "/en/works",
          fr: "/fr/works",
          "x-default": "/en/works",
        },
      },
    });
  });

  it("falls back to English copy for missing locale keys", () => {
    const metadata = buildLocalizedPageMetadata(
      "fr",
      "/library",
      "meta.library.title",
      "meta.library.description",
    );

    expect(metadata.title).toBe("Library | Andromeda");
    expect(metadata.alternates?.canonical).toBe("/fr/library");
  });
});
