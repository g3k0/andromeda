import type {
  TokenRepository,
  WorkRepository,
} from "./ports/work-repository";
import { toPublicTokenDto, type PublicTokenDto } from "./public-dto";

export type LibraryRepositories = {
  tokens: TokenRepository;
  works: WorkRepository;
};

/** A library copy enriched with its edition size for numbered-edition display. */
export type LibraryCopyDto = PublicTokenDto & {
  /** Total edition size as a string, or `null` for an open (unlimited) edition. */
  editionSize: string | null;
};

/** Returns the copies (tokens) currently owned by an address, as public DTOs. */
export async function listLibraryCopies(
  repositories: LibraryRepositories,
  owner: string,
): Promise<LibraryCopyDto[]> {
  const tokens = await repositories.tokens.listByOwner(owner);

  const editionSizeByWork = new Map<string, string | null>();
  const copies: LibraryCopyDto[] = [];

  for (const token of tokens) {
    const workKey = token.workId.toString();
    if (!editionSizeByWork.has(workKey)) {
      const work = await repositories.works.getWork(token.workId);
      const maxCopies = work?.maxCopies ?? 0n;
      editionSizeByWork.set(
        workKey,
        maxCopies > 0n ? maxCopies.toString() : null,
      );
    }

    copies.push({
      ...toPublicTokenDto(token),
      editionSize: editionSizeByWork.get(workKey) ?? null,
    });
  }

  return copies;
}
