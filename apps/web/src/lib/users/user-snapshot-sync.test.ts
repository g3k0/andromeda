/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import type { UserSnapshot } from "./types";
import {
  USER_SNAPSHOT_REFRESH_EVENT,
  requestUserSnapshotRefresh,
} from "./user-snapshot-sync";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

const authorSnapshot: UserSnapshot = {
  normalizedAddress: ADDRESS,
  isConnected: true,
  roleSlug: "author",
  roleName: "Author",
  status: "active",
  permissions: ["pages:read", "authors:write:own"],
  hasAuthorProfile: true,
  declinedAuthorPage: false,
};

describe("user snapshot sync", () => {
  it("dispatches a refresh event in the browser", () => {
    const handler = vi.fn();
    window.addEventListener(USER_SNAPSHOT_REFRESH_EVENT, handler);

    requestUserSnapshotRefresh();

    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(USER_SNAPSHOT_REFRESH_EVENT, handler);
  });

  it("includes the snapshot payload when provided", () => {
    const handler = vi.fn();
    window.addEventListener(USER_SNAPSHOT_REFRESH_EVENT, handler);

    requestUserSnapshotRefresh(authorSnapshot);

    expect(handler).toHaveBeenCalledOnce();
    expect(
      (handler.mock.calls[0]?.[0] as CustomEvent).detail,
    ).toEqual({ snapshot: authorSnapshot });
    window.removeEventListener(USER_SNAPSHOT_REFRESH_EVENT, handler);
  });
});
