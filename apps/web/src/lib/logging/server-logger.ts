import "server-only";

/**
 * Minimal structured server logger for chain/IPFS failures.
 *
 * Goals (see security rules): emit structured, greppable logs server-side while
 * never leaking API keys, bearer tokens, RPC URL secrets, or raw stack traces.
 * Client-facing messages stay generic; only sanitized data reaches the log.
 */

export type LogContext = Record<
  string,
  string | number | boolean | null | undefined
>;

const REDACTED = "[redacted]";

/** Patterns for secrets that must never appear in logs. */
const SENSITIVE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // Authorization: Bearer <token>
  [/Bearer\s+[A-Za-z0-9._\-]+/gi, `Bearer ${REDACTED}`],
  // Alchemy-style RPC URL path key: .../v2/<key>
  [/(\/v2\/)[A-Za-z0-9_\-]{16,}/g, `$1${REDACTED}`],
  // key/token/secret/password in query strings or key:value pairs
  [
    /((?:api[_-]?key|apikey|access[_-]?token|token|secret|signing[_-]?key|password)"?\s*[:=]\s*"?)[^\s"&,}]+/gi,
    `$1${REDACTED}`,
  ],
];

/** Redacts known secret shapes from an arbitrary string. */
export function redactSensitive(text: string): string {
  return SENSITIVE_PATTERNS.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    text,
  );
}

type SanitizedError = { name: string; message: string };

function sanitizeError(error: unknown): SanitizedError {
  if (error instanceof Error) {
    return { name: error.name, message: redactSensitive(error.message) };
  }
  if (typeof error === "string") {
    return { name: "Error", message: redactSensitive(error) };
  }
  return { name: "UnknownError", message: "Non-error value thrown" };
}

function sanitizeContext(context?: LogContext): LogContext {
  if (!context) {
    return {};
  }
  const clean: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) {
      continue;
    }
    clean[key] = typeof value === "string" ? redactSensitive(value) : value;
  }
  return clean;
}

export type ServerLogEntry = {
  level: "error" | "warn";
  scope: string;
  event: string;
  at: string;
  error?: SanitizedError;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | SanitizedError;
};

/** Builds the structured log entry without emitting it (used by the emitters and tests). */
export function buildLogEntry(
  level: "error" | "warn",
  scope: string,
  event: string,
  error: unknown,
  context?: LogContext,
): ServerLogEntry {
  return {
    level,
    scope,
    event,
    ...sanitizeContext(context),
    ...(error !== undefined ? { error: sanitizeError(error) } : {}),
    at: new Date().toISOString(),
  };
}

/** Logs a sanitized server-side error. Never include secrets or stack traces. */
export function logServerError(
  scope: string,
  event: string,
  error: unknown,
  context?: LogContext,
): void {
  console.error(JSON.stringify(buildLogEntry("error", scope, event, error, context)));
}

/** Logs a sanitized server-side warning. */
export function logServerWarn(
  scope: string,
  event: string,
  context?: LogContext,
): void {
  console.warn(JSON.stringify(buildLogEntry("warn", scope, event, undefined, context)));
}
