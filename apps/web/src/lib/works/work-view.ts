import {
  toContentGatewayUrl,
  type ContentGatewayBases,
} from "@/lib/ipfs/gateway-url";
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
  remainingCopies: string | null;
  soldOut: boolean;
  author: `0x${string}`;
  active: boolean;
};

export function buildWorkView(
  dto: PublicWorkDto,
  metadata: AcePublicMetadata | null,
  gateways: ContentGatewayBases,
): WorkView {
  return {
    workId: dto.workId,
    title: metadata?.name?.trim() || `Work #${dto.workId}`,
    description: metadata?.description?.trim() || "",
    coverImageUrl: metadata?.image
      ? toContentGatewayUrl(metadata.image, gateways)
      : null,
    priceLabel: formatWorkPrice(BigInt(dto.price)),
    remainingCopies: dto.remainingCopies,
    soldOut: dto.soldOut,
    author: dto.author,
    active: dto.active,
  };
}
