import { normalizeAddress } from "./address";
import type { AuthorProfile } from "./types";

export type AuthorPageResolved =
  | { status: "invalid_address" }
  | { status: "not_found"; address: string }
  | { status: "ready"; profile: AuthorProfile };

export type AuthorProfileLookup = (
  address: string,
) => AuthorProfile | null | Promise<AuthorProfile | null>;

export async function resolveAuthorPage(
  addressParam: string,
  lookup: AuthorProfileLookup,
): Promise<AuthorPageResolved> {
  const normalized = normalizeAddress(addressParam);
  if (!normalized) {
    return { status: "invalid_address" };
  }

  const profile = await lookup(normalized);
  if (!profile) {
    return { status: "not_found", address: normalized };
  }

  return { status: "ready", profile };
}
