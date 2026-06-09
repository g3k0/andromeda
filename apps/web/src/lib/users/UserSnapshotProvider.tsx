"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
import { whenWalletBound } from "@/lib/auth/wallet-binding-client";
import {
  USER_SNAPSHOT_REFRESH_EVENT,
  type UserSnapshotRefreshDetail,
} from "./user-snapshot-sync";
import { resolveSnapshotUpdate } from "./user-snapshot-guard";
import type { UserSnapshot } from "./types";

type UserSnapshotContextValue = {
  snapshot: UserSnapshot | null;
  refreshSnapshot: () => Promise<UserSnapshot | null>;
  applySnapshot: (snapshot: UserSnapshot | null) => void;
};

const UserSnapshotContext = createContext<UserSnapshotContextValue | null>(null);

export function UserSnapshotProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null);
  const requestIdRef = useRef(0);

  const applySnapshot = useCallback((next: UserSnapshot | null) => {
    requestIdRef.current += 1;
    setSnapshot(next);
  }, []);

  const refreshSnapshot = useCallback(async (): Promise<UserSnapshot | null> => {
    if (!isConnected || !address) {
      applySnapshot(null);
      return null;
    }

    const requestId = ++requestIdRef.current;
    await whenWalletBound(address);
    const next = await getUserSnapshotAction(address, isConnected);

    if (requestId === requestIdRef.current) {
      setSnapshot((current) => resolveSnapshotUpdate(current, next));
    }

    return next;
  }, [address, applySnapshot, isConnected]);

  const refreshSnapshotRef = useRef(refreshSnapshot);
  const applySnapshotRef = useRef(applySnapshot);
  refreshSnapshotRef.current = refreshSnapshot;
  applySnapshotRef.current = applySnapshot;

  useEffect(() => {
    if (!isConnected || !address) {
      applySnapshot(null);
      return;
    }

    let cancelled = false;
    const requestId = ++requestIdRef.current;

    void (async () => {
      await whenWalletBound(address);
      const next = await getUserSnapshotAction(address, isConnected);
      if (!cancelled && requestId === requestIdRef.current) {
        setSnapshot((current) => resolveSnapshotUpdate(current, next));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, applySnapshot, isConnected]);

  useEffect(() => {
    function handleSnapshotRefresh(event: Event) {
      const detail = (event as CustomEvent<UserSnapshotRefreshDetail>).detail;
      if (detail && "snapshot" in detail) {
        applySnapshotRef.current(detail.snapshot ?? null);
        return;
      }

      void refreshSnapshotRef.current();
    }

    window.addEventListener(USER_SNAPSHOT_REFRESH_EVENT, handleSnapshotRefresh);

    return () => {
      window.removeEventListener(
        USER_SNAPSHOT_REFRESH_EVENT,
        handleSnapshotRefresh,
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      snapshot,
      refreshSnapshot,
      applySnapshot,
    }),
    [applySnapshot, refreshSnapshot, snapshot],
  );

  return (
    <UserSnapshotContext.Provider value={value}>
      {children}
    </UserSnapshotContext.Provider>
  );
}

export function useUserSnapshot(): UserSnapshotContextValue {
  const context = useContext(UserSnapshotContext);
  if (!context) {
    throw new Error("useUserSnapshot must be used within UserSnapshotProvider");
  }

  return context;
}
