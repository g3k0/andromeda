import { NextResponse } from "next/server";

import { getAlchemyNotifySigningKey } from "@/lib/config/env";
import {
  ALCHEMY_SIGNATURE_HEADER,
  verifyAlchemySignature,
} from "@/lib/indexer/webhook-signature";

export async function POST(request: Request): Promise<Response> {
  const signingKey = getAlchemyNotifySigningKey();
  if (!signingKey) {
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

  return NextResponse.json({ ok: true });
}
