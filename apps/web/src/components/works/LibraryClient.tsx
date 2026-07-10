"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { useTranslation } from "@/lib/i18n/use-translation";
import {
  ApiClientError,
  parseApiErrorBody,
  translateClientError,
} from "@/lib/i18n/api-error-messages";
import type { LibraryCopyDto } from "@/lib/works/library-service";

import { LibraryList } from "./LibraryList";

async function fetchLibraryCopies(address: string): Promise<LibraryCopyDto[]> {
  const response = await fetch(`/api/library/${address}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    const parsed = parseApiErrorBody(body);
    if (parsed) {
      throw new ApiClientError(parsed.code, parsed.params);
    }
    throw new ApiClientError("unexpected");
  }
  const body = (await response.json()) as { copies: LibraryCopyDto[] };
  return body.copies;
}

export function LibraryClient() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();

  const { data, isLoading, error } = useQuery({
    queryKey: ["library", address],
    queryFn: () => fetchLibraryCopies(address as string),
    enabled: isConnected && Boolean(address),
  });

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        {t("library.connectWallet")}
      </p>
    );
  }

  const errorMessage = error ? translateClientError(t, error) : null;

  return (
    <LibraryList
      copies={data ?? []}
      loading={isLoading}
      error={errorMessage}
    />
  );
}
