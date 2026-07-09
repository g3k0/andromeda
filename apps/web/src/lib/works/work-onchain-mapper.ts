import type { WorkOnChain } from "@/lib/chain/types";

import type { WorkRecord } from "./types";

/** Maps an indexed work projection to the on-chain shape consumed by the mint UI. */
export function workRecordToOnChain(work: WorkRecord): WorkOnChain {
  return {
    workId: work.workId,
    author: work.author,
    metadataURI: work.metadataURI,
    price: work.price,
    maxCopies: work.maxCopies,
    minted: work.minted,
    active: work.active,
  };
}
