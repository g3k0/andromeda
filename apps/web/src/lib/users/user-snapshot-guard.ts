import type { UserSnapshot } from "./types";

export function shouldKeepCurrentSnapshot(
  current: UserSnapshot | null,
  next: UserSnapshot | null,
): boolean {
  if (!current) {
    return false;
  }

  if (!next) {
    return current.isConnected;
  }

  if (current.normalizedAddress !== next.normalizedAddress) {
    return false;
  }

  if (current.hasAuthorProfile && !next.hasAuthorProfile) {
    return true;
  }

  if (current.roleSlug === "author" && next.roleSlug === "reader") {
    return true;
  }

  return false;
}

export function resolveSnapshotUpdate(
  current: UserSnapshot | null,
  next: UserSnapshot | null,
): UserSnapshot | null {
  return shouldKeepCurrentSnapshot(current, next) ? current : next;
}
