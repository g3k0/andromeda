import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MintCopyClient } from "@/components/works/MintCopyClient";
import { WorkDetailView } from "@/components/works/WorkDetailView";
import { getIpfsGatewayBaseUrl } from "@/lib/ipfs/ipfs-config";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { InvalidWorkIdParamError } from "@/lib/works/errors";
import { parseWorkIdParam, toPublicWorkDto } from "@/lib/works/public-dto";
import { workRecordToOnChain } from "@/lib/works/work-onchain-mapper";
import { buildWorkView } from "@/lib/works/work-view";

import { loadPublicWorkMetadata } from "../work-metadata-loader";

export const dynamic = "force-dynamic";

type WorkDetailPageProps = {
  params: Promise<{ workId: string }>;
};

async function resolveWork(workIdParam: string) {
  let workId: bigint;
  try {
    workId = parseWorkIdParam(workIdParam);
  } catch (error) {
    if (error instanceof InvalidWorkIdParamError) {
      return null;
    }
    throw error;
  }

  const repositories = await createMongoIndexerRepositories();
  return repositories.works.getWork(workId);
}

export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { workId } = await params;
  const work = await resolveWork(workId);
  if (!work) {
    return { title: "Work | Andromeda" };
  }

  return {
    title: `Work #${work.workId.toString()} | Andromeda`,
    description: "An author-certified literary edition on Andromeda.",
  };
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { workId } = await params;
  const work = await resolveWork(workId);
  if (!work) {
    notFound();
  }

  const gatewayBaseUrl = getIpfsGatewayBaseUrl();
  const dto = toPublicWorkDto(work);
  const metadata = await loadPublicWorkMetadata(
    work.metadataURI,
    gatewayBaseUrl,
  );
  const view = buildWorkView(dto, metadata, gatewayBaseUrl);

  return (
    <WorkDetailView view={view}>
      <MintCopyClient work={workRecordToOnChain(work)} title={view.title} />
    </WorkDetailView>
  );
}
