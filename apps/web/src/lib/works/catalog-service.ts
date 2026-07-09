import type { WorkRepository } from "./ports/work-repository";
import { toPublicWorkDto, type PublicWorkDto } from "./public-dto";

export type CatalogRepositories = {
  works: WorkRepository;
};

/** Returns active works for the public catalog, newest cursor order preserved. */
export async function listPublicWorks(
  repositories: CatalogRepositories,
): Promise<PublicWorkDto[]> {
  const works = await repositories.works.listWorks();
  return works.filter((work) => work.active).map(toPublicWorkDto);
}

/** Returns a single public work by id, or `null` when it is not indexed. */
export async function getPublicWork(
  repositories: CatalogRepositories,
  workId: bigint,
): Promise<PublicWorkDto | null> {
  const work = await repositories.works.getWork(workId);
  return work ? toPublicWorkDto(work) : null;
}
