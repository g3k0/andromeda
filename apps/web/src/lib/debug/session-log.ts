type SessionLogPayload = {
  runId?: string;
  hypothesisId?: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
};

const DEBUG_SESSION = "4321f4";

/** @internal Temporary debug helper for session 4321f4. */
export function logDebugSession(payload: SessionLogPayload): void {
  const entry = {
    sessionId: DEBUG_SESSION,
    timestamp: Date.now(),
    ...payload,
  };

  if (typeof window === "undefined") {
    console.info(`[debug-${DEBUG_SESSION}]`, JSON.stringify(entry));
    return;
  }

  void fetch("/api/debug/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  }).catch(() => {});
}
