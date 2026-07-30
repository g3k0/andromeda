import type { LogContext } from "@/lib/logging/server-logger";
import { logServerError, logServerInfo } from "@/lib/logging/server-logger";

export type PermanentUploadMetricInput = {
  backend: "arweave" | "pinata";
  outcome: "success" | "error";
  sizeBytes: number;
  durationMs: number;
  /** Turbo winston-credit cost when the SDK reports it. */
  winc?: string | null;
  errorName?: string;
};

/** Builds the structured context logged for permanent-storage uploads. */
export function buildPermanentUploadMetricContext(
  input: PermanentUploadMetricInput,
): LogContext {
  return {
    backend: input.backend,
    outcome: input.outcome,
    sizeBytes: input.sizeBytes,
    durationMs: input.durationMs,
    ...(input.winc ? { winc: input.winc } : {}),
    ...(input.errorName ? { errorName: input.errorName } : {}),
  };
}

/**
 * Emits upload metrics for success-rate / average-cost aggregation from logs.
 * Success → info `turbo_upload_ok`; failure → error `turbo_upload_error`.
 */
export function recordPermanentUploadMetric(
  input: PermanentUploadMetricInput,
): void {
  const context = buildPermanentUploadMetricContext(input);
  if (input.outcome === "success") {
    logServerInfo("ipfs.arweave", "turbo_upload_ok", context);
    return;
  }
  logServerError(
    "ipfs.arweave",
    "turbo_upload_error",
    input.errorName ?? "upload_failed",
    context,
  );
}

/**
 * Running average helper for tests / future dashboards.
 * Ignores non-finite values.
 */
export function averageWincCost(wincValues: readonly string[]): number | null {
  let sum = 0;
  let count = 0;
  for (const value of wincValues) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      continue;
    }
    sum += parsed;
    count += 1;
  }
  if (count === 0) {
    return null;
  }
  return sum / count;
}
