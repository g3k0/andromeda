import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkReaderClient } from "@/components/works/WorkReaderClient";
import { getContractAddress } from "@/lib/config/public-env";
import { toGatewayUrl } from "@/lib/ipfs/gateway-url";
import { getIpfsGatewayBaseUrl } from "@/lib/ipfs/ipfs-config";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { formatCopyLabel } from "@/lib/works/token-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Read | Andromeda",
  description: "Read a copy you own, decrypted in your browser.",
};

type ReadPageProps = {
  params: Promise<{ tokenId: string }>;
};

function parseTokenId(value: string): bigint | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const tokenId = BigInt(value);
  return tokenId > 0n ? tokenId : null;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { tokenId } = await params;
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
      ? formatCopyLabel(token.copyNumber, work.maxCopies)
      : `token #${token.tokenId.toString()}`;
  const editionLabel =
    work.maxCopies > 0n
      ? `Edition of ${work.maxCopies.toString()}`
      : "Open edition";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Reading {copyLabel}</h1>
        <p className="text-sm text-white/60">
          Work #{work.workId.toString()} · {editionLabel}
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
