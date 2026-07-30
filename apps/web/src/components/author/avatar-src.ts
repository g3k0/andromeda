import {
  DEFAULT_CONTENT_GATEWAY_BASES,
  toContentGatewayUrl,
  type ContentGatewayBases,
} from "@/lib/ipfs/gateway-url";

import { AUTHOR_AVATAR_PLACEHOLDER_PATH } from "./constants";

export function resolveAuthorAvatarSrc(
  avatarUrl: string | null,
  gateways: ContentGatewayBases = DEFAULT_CONTENT_GATEWAY_BASES,
): string {
  const trimmed = avatarUrl?.trim();
  if (!trimmed) {
    return AUTHOR_AVATAR_PLACEHOLDER_PATH;
  }

  if (trimmed.startsWith("ipfs://") || trimmed.startsWith("ar://")) {
    return toContentGatewayUrl(trimmed, gateways);
  }

  return trimmed;
}
