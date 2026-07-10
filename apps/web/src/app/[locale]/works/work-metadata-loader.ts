import "server-only";

import { toGatewayUrl } from "@/lib/ipfs/gateway-url";
import {
  parseAcePublicMetadata,
  type AcePublicMetadata,
} from "@/lib/ipfs/metadata-schema";

/** Best-effort fetch of a work's public metadata JSON from the IPFS gateway. */
export async function loadPublicWorkMetadata(
  metadataUri: string,
  gatewayBaseUrl: string,
): Promise<AcePublicMetadata | null> {
  try {
    const response = await fetch(toGatewayUrl(metadataUri, gatewayBaseUrl), {
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
