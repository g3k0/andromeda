import type { ReactNode } from "react";

import type {
  ManuscriptPreviewBlock,
  ParsedManuscriptPreview,
} from "@/lib/works/manuscript-text-parser";
import type { WorkPublishEditionPreview } from "@/lib/works/work-publish-preview";

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function ManuscriptBody({ manuscript }: { manuscript: ParsedManuscriptPreview }) {
  if (manuscript.kind === "unsupported") {
    return (
      <p className="text-sm leading-relaxed text-white/70">{manuscript.message}</p>
    );
  }

  if (manuscript.blocks.length === 0) {
    return (
      <p className="text-sm italic text-white/50">
        No readable body text was found in this manuscript.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {manuscript.blocks.map((block, index) => (
        <ManuscriptBlock key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  );
}

function ManuscriptBlock({ block }: { block: ManuscriptPreviewBlock }) {
  if (block.type === "heading") {
    const className =
      block.level <= 1
        ? "text-2xl font-semibold text-white"
        : block.level === 2
          ? "text-xl font-semibold text-white"
          : "text-lg font-medium text-white/90";

    return (
      <h3 id={block.id} className={`scroll-mt-6 ${className}`}>
        {block.text}
      </h3>
    );
  }

  return (
    <p className="text-sm leading-7 text-white/85">
      {renderInlineMarkdown(block.text)}
    </p>
  );
}

function PreviewPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#120f1a] p-6 shadow-lg shadow-black/20">
      <h2 className="mb-4 border-b border-white/10 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-andromeda-light">
        {title}
      </h2>
      {children}
    </section>
  );
}

export type WorkPublishBookPreviewProps = {
  preview: WorkPublishEditionPreview;
};

export function WorkPublishBookPreview({ preview }: WorkPublishBookPreviewProps) {
  return (
    <div className="space-y-4" aria-label="Edition preview">
      <PreviewPage title="Cover">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {preview.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.coverImageUrl}
              alt={`Cover for ${preview.title}`}
              className="aspect-[2/3] w-full max-w-xs object-cover"
            />
          ) : (
            <div className="flex aspect-[2/3] w-full max-w-xs items-center justify-center bg-white/5 text-sm text-white/40">
              Cover image
            </div>
          )}
          <div className="space-y-1 p-4">
            <p className="text-xl font-semibold text-white">{preview.title}</p>
            <p className="text-sm text-white/70">{preview.authorLabel}</p>
          </div>
        </div>
      </PreviewPage>

      <PreviewPage title="Title page">
        <div className="space-y-3 text-center">
          <p className="text-3xl font-semibold text-white">{preview.title}</p>
          <p className="text-lg text-white/80">{preview.authorLabel}</p>
          <p className="text-xs text-white/50">{preview.authorAddress}</p>
        </div>
      </PreviewPage>

      <PreviewPage title="Colophon">
        <dl className="grid gap-3 sm:grid-cols-2">
          {preview.colophon.map((line) => (
            <div key={line.label} className="rounded-lg bg-white/5 p-3">
              <dt className="text-xs uppercase tracking-wide text-white/45">{line.label}</dt>
              <dd className="mt-1 text-sm text-white/85">{line.value}</dd>
            </div>
          ))}
        </dl>
      </PreviewPage>

      {preview.manuscript.kind === "text" && preview.manuscript.tableOfContents.length > 0 ? (
        <PreviewPage title="Table of contents">
          <ol className="space-y-2">
            {preview.manuscript.tableOfContents.map((entry) => (
              <li
                key={entry.id}
                className="text-sm text-white/80"
                style={{ marginLeft: `${Math.max(entry.level - 1, 0) * 1.25}rem` }}
              >
                <a href={`#${entry.id}`} className="hover:text-andromeda-light hover:underline">
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </PreviewPage>
      ) : null}

      <PreviewPage title="Text">
        <ManuscriptBody manuscript={preview.manuscript} />
      </PreviewPage>

      <PreviewPage title="Back cover">
        <p className="whitespace-pre-wrap text-sm leading-7 text-white/85">
          {preview.backCoverText}
        </p>
      </PreviewPage>

      <PreviewPage title="About the author">
        <p className="whitespace-pre-wrap text-sm leading-7 text-white/85">
          {preview.aboutAuthor}
        </p>
      </PreviewPage>

      <PreviewPage title="Marketplace description">
        <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
          {preview.marketplaceDescription}
        </p>
      </PreviewPage>
    </div>
  );
}
