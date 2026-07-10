"use client";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { formErrorClassName } from "@/components/form/form-field-styles";
import { LocalizedLink } from "@/lib/i18n/LocalizedLink";
import { formatLocalizedCopyLabel } from "@/lib/i18n/work-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { LibraryCopyDto } from "@/lib/works/library-service";

export type LibraryListProps = {
  copies: LibraryCopyDto[];
  loading: boolean;
  error: string | null;
};

export function LibraryList({ copies, loading, error }: LibraryListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <LoadingSpinner size="sm" label={t("library.loadingAria")} />
        {t("library.loading")}
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
        {t("library.emptyBefore")}{" "}
        <LocalizedLink href="/works" className="text-andromeda-light hover:underline">
          {t("library.emptyCatalogLink")}
        </LocalizedLink>{" "}
        {t("library.emptyAfter")}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {copies.map((copy) => {
        const label =
          copy.copyNumber === null
            ? t("library.copyFallback")
            : formatLocalizedCopyLabel(
                t,
                copy.copyNumber,
                copy.editionSize ? BigInt(copy.editionSize) : 0n,
              );

        return (
          <LocalizedLink
            key={copy.tokenId}
            href={`/read/${copy.tokenId}`}
            className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/25"
          >
            <span className="text-base font-semibold text-white">
              {t("library.workNumber", { workId: copy.workId })}
            </span>
            <span className="text-sm text-white/60">
              {label} · {t("library.tokenNumber", { tokenId: copy.tokenId })}
            </span>
            <span className="mt-2 text-sm text-andromeda-light">
              {t("library.readLink")}
            </span>
          </LocalizedLink>
        );
      })}
    </div>
  );
}
