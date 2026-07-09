import { getAddress } from "viem";

import { TokenNotFoundError } from "@/lib/chain/errors";
import type { ChainReader } from "@/lib/chain/ports/chain-reader-port";

/** True when the connected wallet is the on-chain owner of the copy. */
export function isCopyOwner(
  owner: string,
  connected: string | null | undefined,
): boolean {
  if (!connected) {
    return false;
  }
  try {
    return getAddress(owner) === getAddress(connected);
  } catch {
    return false;
  }
}

export type CopyAccess = {
  tokenId: bigint;
  owner: `0x${string}` | null;
  exists: boolean;
  isOwner: boolean;
};

/** Resolves on-chain ownership for a token, gating the reader UI. */
export async function resolveCopyAccess(
  reader: ChainReader,
  tokenId: bigint,
  connected: string | null,
): Promise<CopyAccess> {
  try {
    const tokenOwner = await reader.ownerOf(tokenId);
    return {
      tokenId,
      owner: tokenOwner.owner,
      exists: true,
      isOwner: isCopyOwner(tokenOwner.owner, connected),
    };
  } catch (error) {
    if (error instanceof TokenNotFoundError) {
      return { tokenId, owner: null, exists: false, isOwner: false };
    }
    throw error;
  }
}
