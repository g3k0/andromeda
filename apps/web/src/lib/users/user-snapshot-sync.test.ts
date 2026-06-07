/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import {
  USER_SNAPSHOT_REFRESH_EVENT,
  requestUserSnapshotRefresh,
} from "./user-snapshot-sync";

describe("user snapshot sync", () => {
  it("dispatches a refresh event in the browser", () => {
    const handler = vi.fn();
    window.addEventListener(USER_SNAPSHOT_REFRESH_EVENT, handler);

    requestUserSnapshotRefresh();

    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(USER_SNAPSHOT_REFRESH_EVENT, handler);
  });
});
