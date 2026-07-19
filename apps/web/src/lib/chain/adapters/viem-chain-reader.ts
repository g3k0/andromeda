import type { PublicClient } from "viem";

import {
  assertValidWorkId,
  mapOwnerOf,
  mapRawWorkToWorkOnChain,
} from "../chain-reader";
import { andromedaWorksAbi, getContractAddress } from "../contract";
import { TokenNotFoundError } from "../errors";
import type { ChainReader } from "../ports/chain-reader-port";
import type { RawWorkTuple, TokenOwner, WorkOnChain } from "../types";

export type ViemChainReaderOptions = {
  client: PublicClient;
  contractAddress?: `0x${string}`;
};

export function createViemChainReader({
  client,
  contractAddress = getContractAddress(),
}: ViemChainReaderOptions): ChainReader {
  const address = contractAddress;

  return {
    async getTotalWorks() {
      return (await client.readContract({
        address,
        abi: andromedaWorksAbi,
        functionName: "totalWorks",
      })) as bigint;
    },

    async getWork(workId: bigint): Promise<WorkOnChain> {
      const totalWorks = (await client.readContract({
        address,
        abi: andromedaWorksAbi,
        functionName: "totalWorks",
      })) as bigint;
      assertValidWorkId(workId, totalWorks);

      const [raw, primarySaleRemaining] = await Promise.all([
        client.readContract({
          address,
          abi: andromedaWorksAbi,
          functionName: "works",
          args: [workId],
        }) as Promise<RawWorkTuple>,
        client.readContract({
          address,
          abi: andromedaWorksAbi,
          functionName: "primarySaleRemaining",
          args: [workId],
        }) as Promise<bigint>,
      ]);

      return mapRawWorkToWorkOnChain(workId, raw, primarySaleRemaining);
    },

    async ownerOf(tokenId: bigint): Promise<TokenOwner> {
      try {
        const owner = (await client.readContract({
          address,
          abi: andromedaWorksAbi,
          functionName: "ownerOf",
          args: [tokenId],
        })) as string;

        return mapOwnerOf(tokenId, owner);
      } catch {
        throw new TokenNotFoundError(tokenId);
      }
    },

    async workOfToken(tokenId: bigint): Promise<bigint> {
      return (await client.readContract({
        address,
        abi: andromedaWorksAbi,
        functionName: "workOfToken",
        args: [tokenId],
      })) as bigint;
    },
  };
}
