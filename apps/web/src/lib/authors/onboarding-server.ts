import type { AuthorOnboardingSnapshot } from "./onboarding";
import { buildAuthorOnboardingSnapshotFromService } from "./onboarding";
import { getAuthorService } from "./server";

export async function buildAuthorOnboardingSnapshotAsync(
  address: string | null | undefined,
  isConnected: boolean,
): Promise<AuthorOnboardingSnapshot | null> {
  const service = await getAuthorService();
  return buildAuthorOnboardingSnapshotFromService(
    address,
    isConnected,
    service,
  );
}
