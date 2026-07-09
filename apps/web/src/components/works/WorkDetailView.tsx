import Image from "next/image";
import type { ReactNode } from "react";

import type { WorkView } from "@/lib/works/work-view";

export function WorkDetailView({
  view,
  children,
}: {
  view: WorkView;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {view.coverImageUrl ? (
          <Image
            src={view.coverImageUrl}
            alt={`Cover for ${view.title}`}
            width={320}
            height={480}
            unoptimized
            className="aspect-[2/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center text-xs text-white/40">
            No cover
          </div>
        )}
      </div>

      <div className="space-y-5">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{view.title}</h1>
          <p className="break-all text-xs text-white/50">by {view.author}</p>
        </header>

        {view.description ? (
          <p className="max-w-2xl whitespace-pre-line text-sm text-white/70">
            {view.description}
          </p>
        ) : null}

        {children}
      </div>
    </div>
  );
}
