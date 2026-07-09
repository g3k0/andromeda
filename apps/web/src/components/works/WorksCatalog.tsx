import type { WorkView } from "@/lib/works/work-view";

import { WorkSummaryCard } from "./WorkSummaryCard";

export function WorksCatalog({ works }: { works: WorkView[] }) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Catalog</h1>
        <p className="text-sm text-white/60">
          Browse author-certified editions available on Andromeda.
        </p>
      </header>

      {works.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          No works have been published yet.
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
