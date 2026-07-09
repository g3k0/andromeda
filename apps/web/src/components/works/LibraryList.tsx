import Link from "next/link";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { formErrorClassName } from "@/components/form/form-field-styles";
import type { PublicTokenDto } from "@/lib/works/public-dto";

export type LibraryListProps = {
  copies: PublicTokenDto[];
  loading: boolean;
  error: string | null;
};

export function LibraryList({ copies, loading, error }: LibraryListProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <LoadingSpinner size="sm" /> Loading your library…
      </div>
    );
  }

  if (error) {
    return (
      <p className={formErrorClassName} role="alert">
        {error}
      </p>
    );
  }

  if (copies.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        You don&apos;t own any copies yet. Browse the{" "}
        <Link href="/works" className="text-andromeda-light hover:underline">
          catalog
        </Link>{" "}
        to buy one.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {copies.map((copy) => (
        <Link
          key={copy.tokenId}
          href={`/read/${copy.tokenId}`}
          className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/25"
        >
          <span className="text-base font-semibold text-white">
            Work #{copy.workId}
          </span>
          <span className="text-sm text-white/60">
            {copy.copyNumber !== null ? `Copy #${copy.copyNumber}` : "Copy"} ·
            Token #{copy.tokenId}
          </span>
          <span className="mt-2 text-sm text-andromeda-light">Read →</span>
        </Link>
      ))}
    </div>
  );
}
