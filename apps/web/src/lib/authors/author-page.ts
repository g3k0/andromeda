import { normalizeAddress } from "./address";
import { getAuthorByAddress } from "./mock-store";
import type { AuthorProfile } from "./types";

export type AuthorPageResolved =
  | { status: "invalid_address" }
  | { status: "not_found"; address: string }
  | { status: "ready"; profile: AuthorProfile };

export type AuthorProfileLookup = (address: string) => AuthorProfile | null;

export function resolveAuthorPage(
  addressParam: string,
  lookup: AuthorProfileLookup = getAuthorByAddress,
): AuthorPageResolved {
  const normalized = normalizeAddress(addressParam);
  if (!normalized) {
    return { status: "invalid_address" };
  }

  const profile = lookup(addressParam);
  if (!profile) {
    return { status: "not_found", address: normalized };
  }

  return { status: "ready", profile };
}
