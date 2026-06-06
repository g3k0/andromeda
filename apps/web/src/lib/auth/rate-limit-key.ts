export function buildRateLimitKey(ip: string, scope?: string): string {
  return scope ? `${ip}:${scope}` : ip;
}
