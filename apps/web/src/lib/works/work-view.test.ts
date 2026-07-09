import { describe, expect, it } from "vitest";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

import type { PublicWorkDto } from "./public-dto";
import { buildWorkView } from "./work-view";

const GATEWAY = "https://gateway.test/ipfs";

function dto(overrides: Partial<PublicWorkDto> = {}): PublicWorkDto {
  return {
    workId: "1",
    author: "0x1111111111111111111111111111111111111111",
    metadataURI: "ipfs://meta",
    price: "1000000000000000000",
    maxCopies: "10",
    minted: "3",
    active: true,
    soldOut: false,
    remainingCopies: "7",
    ...overrides,
  };
}

const metadata = {
  name: "The Star Gate",
  description: "A novella about distant stars.",
  image: "ipfs://bafycover",
} as AcePublicMetadata;

describe("buildWorkView", () => {
  it("combines projection and metadata into a display view", () => {
    const view = buildWorkView(dto(), metadata, GATEWAY);
    expect(view.title).toBe("The Star Gate");
    expect(view.description).toBe("A novella about distant stars.");
    expect(view.coverImageUrl).toBe("https://gateway.test/ipfs/bafycover");
    expect(view.priceLabel).toBe("1 POL");
    expect(view.availabilityLabel).toBe("7 copies left");
  });

  it("falls back to a generated title and no cover when metadata is missing", () => {
    const view = buildWorkView(dto({ workId: "9" }), null, GATEWAY);
    expect(view.title).toBe("Work #9");
    expect(view.description).toBe("");
    expect(view.coverImageUrl).toBeNull();
  });

  it("labels sold-out and open editions", () => {
    expect(
      buildWorkView(dto({ soldOut: true, remainingCopies: "0" }), null, GATEWAY)
        .availabilityLabel,
    ).toBe("Sold out");
    expect(
      buildWorkView(dto({ remainingCopies: null }), null, GATEWAY)
        .availabilityLabel,
    ).toBe("Open edition");
  });
});
