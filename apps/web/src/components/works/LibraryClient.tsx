"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import type { LibraryCopyDto } from "@/lib/works/library-service";

import { LibraryList } from "./LibraryList";

async function fetchLibraryCopies(address: string): Promise<LibraryCopyDto[]> {
  const response = await fetch(`/api/library/${address}`);
  if (!response.ok) {
    throw new Error("Failed to load your library.");
  }
  const body = (await response.json()) as { copies: LibraryCopyDto[] };
  return body.copies;
}

export function LibraryClient() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error } = useQuery({
    queryKey: ["library", address],
    queryFn: () => fetchLibraryCopies(address as string),
    enabled: isConnected && Boolean(address),
  });

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Connect your wallet to see the copies you own.
      </p>
    );
  }

  return (
    <LibraryList
      copies={data ?? []}
      loading={isLoading}
      error={
        error
          ? error instanceof Error
            ? error.message
            : "Failed to load your library."
          : null
      }
    />
  );
}
