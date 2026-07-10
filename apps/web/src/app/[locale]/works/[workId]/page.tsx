import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MintCopyClient } from "@/components/works/MintCopyClient";
import { WorkDetailView } from "@/components/works/WorkDetailView";
import { getServerTranslations } from "@/lib/i18n/server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { getIpfsGatewayBaseUrl } from "@/lib/ipfs/ipfs-config";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { InvalidWorkIdParamError } from "@/lib/works/errors";
import { parseWorkIdParam, toPublicWorkDto } from "@/lib/works/public-dto";
import { workRecordToOnChain } from "@/lib/works/work-onchain-mapper";
import { buildWorkView } from "@/lib/works/work-view";

import { loadPublicWorkMetadata } from "../work-metadata-loader";

export const dynamic = "force-dynamic";

type WorkDetailPageProps = {
  params: Promise<{ locale: string; workId: string }>;
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
  const { locale: localeParam, workId } = await params;
  const work = await resolveWork(workId);
  const locale = isSupportedLocale(localeParam)
    ? (localeParam as SupportedLocale)
    : ("en" as const);
  const { t } = getServerTranslations(locale);

  if (!work) {
    return { title: t("work.metaNotFoundTitle") };
  }

  return {
    title: t("work.metaTitle", { workId: work.workId.toString() }),
    description: t("work.metaDescription"),
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
