import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkReaderClient } from "@/components/works/WorkReaderClient";
import { getContractAddress } from "@/lib/config/public-env";
import { toGatewayUrl } from "@/lib/ipfs/gateway-url";
import { getIpfsGatewayBaseUrl } from "@/lib/ipfs/ipfs-config";
import { getServerTranslations } from "@/lib/i18n/server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { formatLocalizedCopyLabel } from "@/lib/i18n/work-labels";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";

export const dynamic = "force-dynamic";

type ReadPageProps = {
  params: Promise<{ locale: string; tokenId: string }>;
};

export async function generateMetadata({
  params,
}: ReadPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isSupportedLocale(localeParam)) {
    return {};
  }

  const { t } = getServerTranslations(localeParam as SupportedLocale);
  return {
    title: t("reader.metaTitle"),
    description: t("reader.metaDescription"),
  };
}

function parseTokenId(value: string): bigint | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const tokenId = BigInt(value);
  return tokenId > 0n ? tokenId : null;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { locale: localeParam, tokenId } = await params;
  const locale = isSupportedLocale(localeParam)
    ? (localeParam as SupportedLocale)
    : ("en" as const);
  const { t } = getServerTranslations(locale);
  const parsed = parseTokenId(tokenId);
  if (parsed === null) {
    notFound();
  }

  const repositories = await createMongoIndexerRepositories();
  const token = await repositories.tokens.getToken(parsed);
  if (!token) {
    notFound();
  }

  const work = await repositories.works.getWork(token.workId);
  if (!work) {
    notFound();
  }

  const gatewayBaseUrl = getIpfsGatewayBaseUrl();
  const copyLabel =
    token.copyNumber !== null
      ? formatLocalizedCopyLabel(t, token.copyNumber, work.maxCopies)
      : t("reader.tokenFallback", { tokenId: token.tokenId.toString() });
  const editionLabel =
    work.maxCopies > 0n
      ? t("reader.editionOf", { size: work.maxCopies.toString() })
      : t("reader.openEdition");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("reader.heading", { copyLabel })}
        </h1>
        <p className="text-sm text-white/60">
          {t("reader.workEdition", {
            workId: work.workId.toString(),
            editionLabel,
          })}
        </p>
      </header>

      <WorkReaderClient
        tokenId={token.tokenId.toString()}
        metadataUrl={toGatewayUrl(
          token.metadataURI ?? work.metadataURI,
          gatewayBaseUrl,
        )}
        envelopeUrl={
          token.envelopeCid
            ? toGatewayUrl(token.envelopeCid, gatewayBaseUrl)
            : null
        }
        gatewayBaseUrl={gatewayBaseUrl}
        contractAddress={getContractAddress()}
      />
    </div>
  );
}
