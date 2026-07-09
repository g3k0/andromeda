"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import type { PublicTokenDto } from "@/lib/works/public-dto";

import { LibraryList } from "./LibraryList";

export function LibraryClient() {
  const { address, isConnected } = useAccount();
  const [copies, setCopies] = useState<PublicTokenDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setCopies([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/library/${address}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load your library.");
        }
        const body = (await response.json()) as { copies: PublicTokenDto[] };
        if (!cancelled) {
          setCopies(body.copies);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load your library.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        Connect your wallet to see the copies you own.
      </p>
    );
  }

  return <LibraryList copies={copies} loading={loading} error={error} />;
}
