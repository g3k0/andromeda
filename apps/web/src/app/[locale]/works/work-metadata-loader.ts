import "server-only";

import {
  toContentGatewayUrl,
  type ContentGatewayBases,
} from "@/lib/ipfs/gateway-url";
import {
  parseAcePublicMetadata,
  type AcePublicMetadata,
} from "@/lib/ipfs/metadata-schema";

/** Best-effort fetch of a work's public metadata JSON from a content gateway. */
export async function loadPublicWorkMetadata(
  metadataUri: string,
  gateways: ContentGatewayBases,
): Promise<AcePublicMetadata | null> {
  try {
    const response = await fetch(toContentGatewayUrl(metadataUri, gateways), {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return parseAcePublicMetadata(await response.json());
  } catch {
    return null;
  }
}
