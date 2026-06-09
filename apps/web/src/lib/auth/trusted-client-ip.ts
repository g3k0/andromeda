export function getTrustedClientIp(
  headers: Headers | { get(name: string): string | null },
): string {
  const trustProxy = process.env.TRUST_PROXY === "true";

  if (trustProxy) {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }

    const realIp = headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
  }

  return "unknown";
}
