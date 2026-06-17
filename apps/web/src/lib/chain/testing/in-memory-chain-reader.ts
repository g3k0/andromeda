import {
  assertValidWorkId,
  mapOwnerOf,
  mapRawWorkToWorkOnChain,
} from "../chain-reader";
import { TokenNotFoundError, WorkNotFoundError } from "../errors";
import type { ChainReader } from "../ports/chain-reader-port";
import type { WorkOnChain } from "../types";

export type InMemoryToken = {
  tokenId: bigint;
  owner: `0x${string}`;
  workId: bigint;
};

export type InMemoryChainReaderSeed = {
  totalWorks?: bigint;
  works?: WorkOnChain[];
  tokens?: InMemoryToken[];
};

export type InMemoryChainState = {
  totalWorks: bigint;
  works: Map<bigint, WorkOnChain>;
  tokens: Map<bigint, InMemoryToken>;
};

export function createInMemoryChainState(
  seed: InMemoryChainReaderSeed = {},
): InMemoryChainState {
  const works = new Map<bigint, WorkOnChain>(
    (seed.works ?? []).map((work) => [work.workId, work]),
  );
  const tokens = new Map<bigint, InMemoryToken>(
    (seed.tokens ?? []).map((token) => [token.tokenId, token]),
  );

  const totalWorks =
    seed.totalWorks ??
    (works.size === 0
      ? 0n
      : [...works.keys()].reduce(
          (max, workId) => (workId > max ? workId : max),
          0n,
        ));

  return { totalWorks, works, tokens };
}

function isInMemoryChainState(
  seed: InMemoryChainReaderSeed | InMemoryChainState,
): seed is InMemoryChainState {
  return seed.works instanceof Map;
}

export function createInMemoryChainReader(
  seed: InMemoryChainReaderSeed | InMemoryChainState = {},
): ChainReader {
  const state = isInMemoryChainState(seed)
    ? seed
    : createInMemoryChainState(seed);

  return {
    async getTotalWorks() {
      return state.totalWorks;
    },

    async getWork(workId: bigint) {
      assertValidWorkId(workId, state.totalWorks);

      const work = state.works.get(workId);
      if (!work) {
        throw new WorkNotFoundError(workId);
      }

      return mapRawWorkToWorkOnChain(workId, [
        work.author,
        work.metadataURI,
        work.price,
        work.maxCopies,
        work.minted,
        work.active,
      ]);
    },

    async ownerOf(tokenId: bigint) {
      const token = state.tokens.get(tokenId);
      if (!token) {
        throw new TokenNotFoundError(tokenId);
      }

      return mapOwnerOf(tokenId, token.owner);
    },

    async workOfToken(tokenId: bigint) {
      return state.tokens.get(tokenId)?.workId ?? 0n;
    },
  };
}
