import type { TokenOwner, WorkOnChain } from "../types";

export type ChainReader = {
  getTotalWorks(): Promise<bigint>;
  getWork(workId: bigint): Promise<WorkOnChain>;
  ownerOf(tokenId: bigint): Promise<TokenOwner>;
  workOfToken(tokenId: bigint): Promise<bigint>;
};
