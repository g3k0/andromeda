import { describe, expect, it } from "vitest";

import { createTranslateFn } from "./translate";
import {
  formatLocalizedCopyLabel,
  formatMintAvailabilityLabel,
  formatWorkAvailabilityLabel,
} from "./work-labels";

const t = createTranslateFn("en");

describe("work i18n labels", () => {
  it("formats catalog availability states", () => {
    expect(
      formatWorkAvailabilityLabel(t, {
        remainingCopies: "7",
        soldOut: false,
      }),
    ).toBe("7 copies left");
    expect(
      formatWorkAvailabilityLabel(t, {
        remainingCopies: "0",
        soldOut: true,
      }),
    ).toBe("Sold out");
    expect(
      formatWorkAvailabilityLabel(t, {
        remainingCopies: null,
        soldOut: false,
      }),
    ).toBe("Open edition");
  });

  it("formats mint availability states", () => {
    expect(
      formatMintAvailabilityLabel(t, {
        remaining: 60n,
        soldOut: false,
        saleOpen: true,
      }),
    ).toBe("60 copies left");
  });

  it("formats localized copy labels", () => {
    expect(formatLocalizedCopyLabel(t, 3, 10n)).toBe("Copy #3 / 10");
    expect(formatLocalizedCopyLabel(t, 3, 0n)).toBe("Copy #3");
  });
});
