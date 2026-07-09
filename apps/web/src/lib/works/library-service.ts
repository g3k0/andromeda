import type { TokenRepository } from "./ports/work-repository";
import { toPublicTokenDto, type PublicTokenDto } from "./public-dto";

export type LibraryRepositories = {
  tokens: TokenRepository;
};

/** Returns the copies (tokens) currently owned by an address, as public DTOs. */
export async function listLibraryCopies(
  repositories: LibraryRepositories,
  owner: string,
): Promise<PublicTokenDto[]> {
  const tokens = await repositories.tokens.listByOwner(owner);
  return tokens.map(toPublicTokenDto);
}
