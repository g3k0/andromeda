import type { TokenRecord, WorkRecord } from "@/lib/works/types";

/** Continuity bootstrap index: work/token → permanent content URIs. */
export type ContinuityIndex = {
  schema: "andromeda.continuity.v1";
  generatedAt: string;
  chainId?: number;
  contractAddress?: string;
  works: ContinuityWorkEntry[];
};

export type ContinuityWorkEntry = {
  workId: string;
  author: string;
  metadataURI: string;
  encryptedContentCid: string | null;
  tokens: ContinuityTokenEntry[];
};

export type ContinuityTokenEntry = {
  tokenId: string;
  owner: string;
  copyNumber: number | null;
  metadataURI: string | null;
  envelopeURI: string | null;
};

export type BuildContinuityIndexInput = {
  works: readonly WorkRecord[];
  /** All tokens; filtered/grouped by workId. */
  tokens: readonly TokenRecord[];
  generatedAt?: string;
  chainId?: number;
  contractAddress?: string;
};

/** Builds a JSON-serializable URI index for Arweave continuity export. */
export function buildContinuityIndex(
  input: BuildContinuityIndexInput,
): ContinuityIndex {
  const tokensByWork = new Map<string, TokenRecord[]>();
  for (const token of input.tokens) {
    const key = token.workId.toString();
    const list = tokensByWork.get(key) ?? [];
    list.push(token);
    tokensByWork.set(key, list);
  }

  const works = [...input.works]
    .sort((a, b) => (a.workId < b.workId ? -1 : a.workId > b.workId ? 1 : 0))
    .map((work) => {
      const workTokens = (tokensByWork.get(work.workId.toString()) ?? []).sort(
        (a, b) => (a.tokenId < b.tokenId ? -1 : a.tokenId > b.tokenId ? 1 : 0),
      );
      return {
        workId: work.workId.toString(),
        author: work.author,
        metadataURI: work.metadataURI,
        encryptedContentCid: work.encryptedContentCid,
        tokens: workTokens.map((token) => ({
          tokenId: token.tokenId.toString(),
          owner: token.owner,
          copyNumber: token.copyNumber,
          metadataURI: token.metadataURI,
          envelopeURI: token.envelopeCid,
        })),
      };
    });

  return {
    schema: "andromeda.continuity.v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    ...(input.chainId !== undefined ? { chainId: input.chainId } : {}),
    ...(input.contractAddress
      ? { contractAddress: input.contractAddress }
      : {}),
    works,
  };
}
