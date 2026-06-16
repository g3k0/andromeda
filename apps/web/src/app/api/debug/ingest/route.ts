import { jsonResponse } from "@/lib/authors/api-utils";

const DEBUG_SESSION = "4321f4";

function isDebugIngestEnabled(): boolean {
  return (
    process.env.DEBUG_SESSION_INGEST === DEBUG_SESSION ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isDebugIngestEnabled()) {
    return jsonResponse({ error: "Not found" }, 404);
  }

  try {
    const body = await request.json();
    console.info(`[debug-${DEBUG_SESSION}]`, JSON.stringify(body));
    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: "Invalid payload" }, 400);
  }
}
