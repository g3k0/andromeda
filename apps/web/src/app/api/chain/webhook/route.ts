import { NextResponse } from "next/server";

import { getAlchemyNotifySigningKey } from "@/lib/config/env";
import { logServerError } from "@/lib/logging/server-logger";
import { extractLogsFromAlchemyPayload } from "@/lib/indexer/alchemy-payload";
import { handleChainLogs } from "@/lib/indexer/chain-event-handler";
import {
  ALCHEMY_SIGNATURE_HEADER,
  verifyAlchemySignature,
} from "@/lib/indexer/webhook-signature";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { markWorkUploadRegistered } from "@/lib/works/work-upload-indexer-hook";

export async function POST(request: Request): Promise<Response> {
  const signingKey = getAlchemyNotifySigningKey();
  if (!signingKey) {
    logServerError("chain.webhook", "not_configured", undefined);
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get(ALCHEMY_SIGNATURE_HEADER);
  if (!verifyAlchemySignature(rawBody, signature, signingKey)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const logs = extractLogsFromAlchemyPayload(payload);

  try {
    const repositories = await createMongoIndexerRepositories();
    const result = await handleChainLogs(repositories, logs, {
      onWorkRegistered: markWorkUploadRegistered,
    });
    return NextResponse.json({ ok: true, processed: result.processed });
  } catch (error) {
    logServerError("chain.webhook", "process_failed", error, {
      logs: logs.length,
    });
    // Return 500 so Alchemy retries; event handling is idempotent.
    return NextResponse.json(
      { error: "Failed to process webhook." },
      { status: 500 },
    );
  }
}
