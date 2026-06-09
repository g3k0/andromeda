import { describe, expect, it } from "vitest";
import {
  resolveSnapshotUpdate,
  shouldKeepCurrentSnapshot,
} from "./user-snapshot-guard";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

const authorSnapshot = {
  normalizedAddress: ADDRESS,
  isConnected: true,
  roleSlug: "author" as const,
  roleName: "Author",
  status: "active" as const,
  permissions: ["pages:read", "authors:write:own"] as const,
  hasAuthorProfile: true,
  declinedAuthorPage: false,
};

const readerSnapshot = {
  normalizedAddress: ADDRESS,
  isConnected: true,
  roleSlug: "reader" as const,
  roleName: "Reader",
  status: "active" as const,
  permissions: ["pages:read"] as const,
  hasAuthorProfile: false,
  declinedAuthorPage: false,
};

describe("shouldKeepCurrentSnapshot", () => {
  it("keeps an author snapshot when a stale fetch returns reader", () => {
    expect(shouldKeepCurrentSnapshot(authorSnapshot, readerSnapshot)).toBe(true);
  });

  it("keeps a connected snapshot when a refetch returns null", () => {
    expect(shouldKeepCurrentSnapshot(authorSnapshot, null)).toBe(true);
  });

  it("allows reader snapshots when no author profile is currently shown", () => {
    expect(shouldKeepCurrentSnapshot(readerSnapshot, readerSnapshot)).toBe(
      false,
    );
  });
});

describe("resolveSnapshotUpdate", () => {
  it("returns the incoming snapshot when there is no regression", () => {
    expect(resolveSnapshotUpdate(readerSnapshot, authorSnapshot)).toEqual(
      authorSnapshot,
    );
  });

  it("preserves the current snapshot when a stale reader response arrives", () => {
    expect(resolveSnapshotUpdate(authorSnapshot, readerSnapshot)).toEqual(
      authorSnapshot,
    );
  });
});
