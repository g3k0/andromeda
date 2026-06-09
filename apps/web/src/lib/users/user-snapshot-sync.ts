import type { UserSnapshot } from "./types";

export const USER_SNAPSHOT_REFRESH_EVENT = "andromeda:user-snapshot-refresh";

export type UserSnapshotRefreshDetail = {
  snapshot?: UserSnapshot | null;
};

export function requestUserSnapshotRefresh(
  snapshot?: UserSnapshot | null,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<UserSnapshotRefreshDetail>(USER_SNAPSHOT_REFRESH_EVENT, {
      detail: snapshot === undefined ? {} : { snapshot },
    }),
  );
}
