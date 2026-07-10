import type { Metadata } from "next";

import { WorksCatalog } from "@/components/works/WorksCatalog";
import { getIpfsGatewayBaseUrl } from "@/lib/ipfs/ipfs-config";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { toPublicWorkDto } from "@/lib/works/public-dto";
import { buildWorkView } from "@/lib/works/work-view";

import { loadPublicWorkMetadata } from "./work-metadata-loader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalog | Andromeda",
  description: "Browse author-certified literary editions on Andromeda.",
};

export default async function WorksPage() {
  const gatewayBaseUrl = getIpfsGatewayBaseUrl();
  const repositories = await createMongoIndexerRepositories();
  const works = (await repositories.works.listWorks()).filter(
    (work) => work.active,
  );

  const views = await Promise.all(
    works.map(async (work) => {
      const dto = toPublicWorkDto(work);
      const metadata = await loadPublicWorkMetadata(
        work.metadataURI,
        gatewayBaseUrl,
      );
      return buildWorkView(dto, metadata, gatewayBaseUrl);
    }),
  );

  return <WorksCatalog works={views} />;
}
