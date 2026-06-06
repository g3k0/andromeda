"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  decrementLoadingCount,
  incrementLoadingCount,
  isLoadingActive,
} from "@/lib/loading/loading-state";
import { LoadingOverlay } from "./LoadingOverlay";

type LoadingContextValue = {
  isLoading: boolean;
  runWithLoading: <T>(task: () => Promise<T>, label?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [label, setLabel] = useState("Processing…");

  const runWithLoading = useCallback(
    async <T,>(task: () => Promise<T>, nextLabel = "Processing…"): Promise<T> => {
      setLabel(nextLabel);
      setPendingCount((current) => incrementLoadingCount(current));
      try {
        return await task();
      } finally {
        setPendingCount((current) => decrementLoadingCount(current));
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      isLoading: isLoadingActive(pendingCount),
      runWithLoading,
    }),
    [pendingCount, runWithLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {value.isLoading ? <LoadingOverlay label={label} /> : null}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider.");
  }
  return context;
}
