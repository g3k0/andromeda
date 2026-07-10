"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import type { WorkView } from "@/lib/works/work-view";

import { WorkSummaryCard } from "./WorkSummaryCard";

export function WorksCatalog({ works }: { works: WorkView[] }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("catalog.title")}</h1>
        <p className="text-sm text-white/60">{t("catalog.subtitle")}</p>
      </header>

      {works.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          {t("catalog.empty")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((view) => (
            <WorkSummaryCard key={view.workId} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}
