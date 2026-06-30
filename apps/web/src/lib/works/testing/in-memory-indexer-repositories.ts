import { getAddress } from "viem";

import type { IndexerRepositories } from "../ports/work-repository";
import type {
  TokenRecord,
  UpsertTokenInput,
  UpsertWorkInput,
  WorkRecord,
} from "../types";

export function createInMemoryIndexerRepositories(): IndexerRepositories {
  const works = new Map<string, WorkRecord>();
  const tokens = new Map<string, TokenRecord>();
  let lastProcessedBlock = 0n;

  function nowIso(): string {
    return new Date().toISOString();
  }

  return {
    works: {
      async upsertWork(input: UpsertWorkInput) {
        const key = input.workId.toString();
        const existing = works.get(key);
        const record: WorkRecord = {
          workId: input.workId,
          author: getAddress(input.author),
          metadataURI: input.metadataURI,
          encryptedContentCid:
            input.encryptedContentCid !== undefined
              ? input.encryptedContentCid
              : (existing?.encryptedContentCid ?? null),
          price: input.price,
          maxCopies: input.maxCopies,
          minted: existing?.minted ?? 0n,
          active: input.active ?? existing?.active ?? true,
          createdAt: existing?.createdAt ?? nowIso(),
          updatedAt: nowIso(),
        };
        works.set(key, record);
        return record;
      },
      async getWork(workId: bigint) {
        return works.get(workId.toString()) ?? null;
      },
      async listWorks() {
        return [...works.values()].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        );
      },
      async setActive(workId: bigint, active: boolean) {
        const record = works.get(workId.toString());
        if (record) {
          works.set(workId.toString(), {
            ...record,
            active,
            updatedAt: nowIso(),
          });
        }
      },
      async setMinted(workId: bigint, minted: bigint) {
        const record = works.get(workId.toString());
        if (record) {
          works.set(workId.toString(), {
            ...record,
            minted,
            updatedAt: nowIso(),
          });
        }
      },
    },
    tokens: {
      async upsertToken(input: UpsertTokenInput) {
        const key = input.tokenId.toString();
        const existing = tokens.get(key);
        const record: TokenRecord = {
          tokenId: input.tokenId,
          workId: input.workId,
          owner: getAddress(input.owner),
          copyNumber:
            input.copyNumber !== undefined
              ? input.copyNumber
              : (existing?.copyNumber ?? null),
          tbaAddress:
            input.tbaAddress !== undefined
              ? input.tbaAddress
                ? getAddress(input.tbaAddress)
                : null
              : (existing?.tbaAddress ?? null),
          envelopeCid:
            input.envelopeCid !== undefined
              ? input.envelopeCid
              : (existing?.envelopeCid ?? null),
          createdAt: existing?.createdAt ?? nowIso(),
          updatedAt: nowIso(),
        };
        tokens.set(key, record);
        return record;
      },
      async getToken(tokenId: bigint) {
        return tokens.get(tokenId.toString()) ?? null;
      },
      async listByOwner(owner: string) {
        const normalized = owner.toLowerCase();
        return [...tokens.values()]
          .filter((token) => token.owner.toLowerCase() === normalized)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },
      async setOwner(tokenId: bigint, owner: string) {
        const record = tokens.get(tokenId.toString());
        if (!record) {
          return false;
        }
        tokens.set(tokenId.toString(), {
          ...record,
          owner: getAddress(owner),
          updatedAt: nowIso(),
        });
        return true;
      },
    },
    chainSync: {
      async getLastProcessedBlock() {
        return lastProcessedBlock;
      },
      async setLastProcessedBlock(block: bigint) {
        lastProcessedBlock = block;
      },
    },
  };
}
