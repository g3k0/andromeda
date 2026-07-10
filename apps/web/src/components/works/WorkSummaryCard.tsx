import Image from "next/image";

import { LocalizedLink } from "@/lib/i18n/LocalizedLink";
import type { WorkView } from "@/lib/works/work-view";

export function WorkSummaryCard({ view }: { view: WorkView }) {
  return (
    <LocalizedLink
      href={`/works/${view.workId}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-white/25"
    >
      <div className="aspect-[3/2] w-full overflow-hidden bg-white/5">
        {view.coverImageUrl ? (
          <Image
            src={view.coverImageUrl}
            alt={`Cover for ${view.title}`}
            width={320}
            height={214}
            unoptimized
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
            No cover
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h2 className="truncate text-base font-semibold text-white">
          {view.title}
        </h2>
        <p className="text-sm text-white/60">
          {view.priceLabel} · {view.availabilityLabel}
        </p>
      </div>
    </LocalizedLink>
  );
}
