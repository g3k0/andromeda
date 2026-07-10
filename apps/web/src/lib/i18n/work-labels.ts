import type { WorkAvailability } from "@/lib/works/mint-copy-tx";
import type { PublicWorkDto } from "@/lib/works/public-dto";

import type { TranslateFn } from "./translate";

export type AvailabilityInput = Pick<
  PublicWorkDto,
  "remainingCopies" | "soldOut"
>;

export function formatWorkAvailabilityLabel(
  t: TranslateFn,
  input: AvailabilityInput,
): string {
  if (input.remainingCopies === null) {
    return t("catalog.openEdition");
  }
  if (input.soldOut) {
    return t("catalog.soldOut");
  }
  return t("catalog.copiesLeft", { count: input.remainingCopies });
}

export function formatMintAvailabilityLabel(
  t: TranslateFn,
  availability: WorkAvailability,
): string {
  if (availability.remaining === null) {
    return t("catalog.openEdition");
  }
  if (availability.soldOut) {
    return t("catalog.soldOut");
  }
  return t("catalog.copiesLeft", {
    count: availability.remaining.toString(),
  });
}

export function formatLocalizedCopyLabel(
  t: TranslateFn,
  copyNumber: number,
  maxCopies: bigint,
): string {
  if (maxCopies > 0n) {
    return t("library.copyNumberOf", {
      number: String(copyNumber),
      total: maxCopies.toString(),
    });
  }
  return t("library.copyNumber", { number: String(copyNumber) });
}
