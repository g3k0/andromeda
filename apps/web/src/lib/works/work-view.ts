import { toGatewayUrl } from "@/lib/ipfs/gateway-url";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

import { formatWorkPrice } from "./mint-copy-tx";
import type { PublicWorkDto } from "./public-dto";

/** Display-ready view of a catalog work, combining projection + public metadata. */
export type WorkView = {
  workId: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  priceLabel: string;
  availabilityLabel: string;
  author: `0x${string}`;
  active: boolean;
};

function availabilityLabel(dto: PublicWorkDto): string {
  if (dto.remainingCopies === null) {
    return "Open edition";
  }
  if (dto.soldOut) {
    return "Sold out";
  }
  return `${dto.remainingCopies} copies left`;
}

export function buildWorkView(
  dto: PublicWorkDto,
  metadata: AcePublicMetadata | null,
  gatewayBaseUrl: string,
): WorkView {
  return {
    workId: dto.workId,
    title: metadata?.name?.trim() || `Work #${dto.workId}`,
    description: metadata?.description?.trim() || "",
    coverImageUrl: metadata?.image
      ? toGatewayUrl(metadata.image, gatewayBaseUrl)
      : null,
    priceLabel: formatWorkPrice(BigInt(dto.price)),
    availabilityLabel: availabilityLabel(dto),
    author: dto.author,
    active: dto.active,
  };
}
