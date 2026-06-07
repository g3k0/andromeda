export const USER_SNAPSHOT_REFRESH_EVENT = "andromeda:user-snapshot-refresh";

export function requestUserSnapshotRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(USER_SNAPSHOT_REFRESH_EVENT));
}
