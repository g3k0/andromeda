import { isIpfsUri } from "@/lib/ipfs/content-uri";
import {
  parseAcePublicMetadata,
  type AcePublicMetadata,
} from "@/lib/ipfs/metadata-schema";

export type MigrationBlobKind =
  | "work-metadata"
  | "cover"
  | "ciphertext"
  | "copy-metadata"
  | "envelope";

export type MigrationRowStatus = "ok" | "orphan" | "skipped";

export type MigrationRow = {
  workId: string;
  tokenId?: string;
  kind: MigrationBlobKind;
  oldUri: string;
  newUri: string | null;
  status: MigrationRowStatus;
  error?: string;
};

export type MigrationTokenInput = {
  tokenId: bigint;
  metadataURI: string | null;
  envelopeCid: string | null;
};

export type MigrateWorkInput = {
  workId: bigint;
  metadataUri: string;
  tokens?: readonly MigrationTokenInput[];
};

export type MigrateWorkDeps = {
  fetchBytes: (uri: string) => Promise<Uint8Array>;
  uploadBlob: (
    data: Uint8Array,
    options?: { name?: string },
  ) => Promise<{ uri: string }>;
  uploadJson: (
    data: unknown,
    options?: { name?: string },
  ) => Promise<{ uri: string }>;
};

export type MigrateWorkResult = {
  rows: MigrationRow[];
  newWorkMetadataUri: string | null;
  /** Suggested on-chain updates after a successful migration. */
  suggestedOnChain: {
    updateWorkMetadataURI?: { workId: string; metadataUri: string };
    setCopyMetadataURI: Array<{ tokenId: string; metadataUri: string }>;
    setCopyEnvelopeURI: Array<{ tokenId: string; envelopeUri: string }>;
  };
};

function decodeJson(bytes: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

async function migrateIpfsBlob(input: {
  workId: bigint;
  tokenId?: bigint;
  kind: MigrationBlobKind;
  uri: string;
  deps: MigrateWorkDeps;
  name: string;
}): Promise<MigrationRow> {
  const base: MigrationRow = {
    workId: input.workId.toString(),
    ...(input.tokenId !== undefined
      ? { tokenId: input.tokenId.toString() }
      : {}),
    kind: input.kind,
    oldUri: input.uri,
    newUri: null,
    status: "skipped",
  };

  if (!isIpfsUri(input.uri)) {
    return { ...base, status: "skipped" };
  }

  try {
    const bytes = await input.deps.fetchBytes(input.uri);
    const uploaded = await input.deps.uploadBlob(bytes, { name: input.name });
    return {
      ...base,
      newUri: uploaded.uri,
      status: "ok",
    };
  } catch (error) {
    return {
      ...base,
      status: "orphan",
      error: error instanceof Error ? error.message : "fetch_or_upload_failed",
    };
  }
}

async function migrateAceDocument(input: {
  workId: bigint;
  tokenId?: bigint;
  kind: "work-metadata" | "copy-metadata";
  uri: string;
  deps: MigrateWorkDeps;
}): Promise<{
  rows: MigrationRow[];
  metadataRow: MigrationRow;
  metadata: AcePublicMetadata | null;
}> {
  const base: MigrationRow = {
    workId: input.workId.toString(),
    ...(input.tokenId !== undefined
      ? { tokenId: input.tokenId.toString() }
      : {}),
    kind: input.kind,
    oldUri: input.uri,
    newUri: null,
    status: "skipped",
  };

  if (!isIpfsUri(input.uri)) {
    return {
      rows: [{ ...base, status: "skipped" }],
      metadataRow: { ...base, status: "skipped" },
      metadata: null,
    };
  }

  try {
    const bytes = await input.deps.fetchBytes(input.uri);
    const metadata = parseAcePublicMetadata(decodeJson(bytes));

    const cover = await migrateIpfsBlob({
      workId: input.workId,
      tokenId: input.tokenId,
      kind: "cover",
      uri: metadata.image,
      deps: input.deps,
      name: `work-${input.workId}-cover`,
    });
    const ciphertext = await migrateIpfsBlob({
      workId: input.workId,
      tokenId: input.tokenId,
      kind: "ciphertext",
      uri: metadata.ace.encrypted_content,
      deps: input.deps,
      name: `work-${input.workId}-ciphertext`,
    });

    if (cover.status === "orphan" || ciphertext.status === "orphan") {
      const metadataRow: MigrationRow = {
        ...base,
        status: "orphan",
        error: "nested_ipfs_blob_unreachable",
      };
      return {
        rows: [cover, ciphertext, metadataRow],
        metadataRow,
        metadata: null,
      };
    }

    const rewritten: AcePublicMetadata = {
      ...metadata,
      image:
        cover.status === "ok" && cover.newUri ? cover.newUri : metadata.image,
      ace: {
        ...metadata.ace,
        encrypted_content:
          ciphertext.status === "ok" && ciphertext.newUri
            ? ciphertext.newUri
            : metadata.ace.encrypted_content,
      },
    };

    const uploaded = await input.deps.uploadJson(rewritten, {
      name: `work-${input.workId}-${input.kind}.json`,
    });
    const metadataRow: MigrationRow = {
      ...base,
      newUri: uploaded.uri,
      status: "ok",
    };

    return {
      rows: [cover, ciphertext, metadataRow],
      metadataRow,
      metadata: rewritten,
    };
  } catch (error) {
    const metadataRow: MigrationRow = {
      ...base,
      status: "orphan",
      error: error instanceof Error ? error.message : "fetch_or_upload_failed",
    };
    return { rows: [metadataRow], metadataRow, metadata: null };
  }
}

/**
 * Migrates a legacy work's IPFS blobs to Arweave and returns a report.
 * Does not submit on-chain txs — callers use `suggestedOnChain` with the author wallet.
 */
export async function migrateWorkToArweave(
  input: MigrateWorkInput,
  deps: MigrateWorkDeps,
): Promise<MigrateWorkResult> {
  const rows: MigrationRow[] = [];
  const suggestedOnChain: MigrateWorkResult["suggestedOnChain"] = {
    setCopyMetadataURI: [],
    setCopyEnvelopeURI: [],
  };

  const workMigration = await migrateAceDocument({
    workId: input.workId,
    kind: "work-metadata",
    uri: input.metadataUri,
    deps,
  });
  rows.push(...workMigration.rows);

  if (workMigration.metadataRow.status === "ok" && workMigration.metadataRow.newUri) {
    suggestedOnChain.updateWorkMetadataURI = {
      workId: input.workId.toString(),
      metadataUri: workMigration.metadataRow.newUri,
    };
  }

  const tokenResults = await Promise.all(
    (input.tokens ?? []).map(async (token) => {
      const tokenRows: MigrationRow[] = [];
      const copyMetadata: Array<{ tokenId: string; metadataUri: string }> = [];
      const copyEnvelope: Array<{ tokenId: string; envelopeUri: string }> = [];

      const [copyMigration, envelope] = await Promise.all([
        token.metadataURI
          ? migrateAceDocument({
              workId: input.workId,
              tokenId: token.tokenId,
              kind: "copy-metadata",
              uri: token.metadataURI,
              deps,
            })
          : Promise.resolve(null),
        token.envelopeCid
          ? migrateIpfsBlob({
              workId: input.workId,
              tokenId: token.tokenId,
              kind: "envelope",
              uri: token.envelopeCid,
              deps,
              name: `token-${token.tokenId}-envelope`,
            })
          : Promise.resolve(null),
      ]);

      if (copyMigration) {
        tokenRows.push(...copyMigration.rows);
        if (
          copyMigration.metadataRow.status === "ok" &&
          copyMigration.metadataRow.newUri
        ) {
          copyMetadata.push({
            tokenId: token.tokenId.toString(),
            metadataUri: copyMigration.metadataRow.newUri,
          });
        }
      }

      if (envelope) {
        tokenRows.push(envelope);
        if (envelope.status === "ok" && envelope.newUri) {
          copyEnvelope.push({
            tokenId: token.tokenId.toString(),
            envelopeUri: envelope.newUri,
          });
        }
      }

      return { tokenRows, copyMetadata, copyEnvelope };
    }),
  );

  for (const result of tokenResults) {
    rows.push(...result.tokenRows);
    suggestedOnChain.setCopyMetadataURI.push(...result.copyMetadata);
    suggestedOnChain.setCopyEnvelopeURI.push(...result.copyEnvelope);
  }

  return {
    rows,
    newWorkMetadataUri:
      workMigration.metadataRow.status === "ok"
        ? workMigration.metadataRow.newUri
        : null,
    suggestedOnChain,
  };
}

/** Summarizes orphan rows for operator reports. */
export function summarizeMigrationOrphans(
  rows: readonly MigrationRow[],
): MigrationRow[] {
  return rows.filter((row) => row.status === "orphan");
}
