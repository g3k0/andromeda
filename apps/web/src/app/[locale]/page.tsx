import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Andromeda — Read, own and collect literary works on-chain",
  description:
    "Andromeda turns every book into an author-certified NFT. Writers publish and sell directly to readers, and readers truly own the editions they buy.",
};

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-lg font-medium tracking-wide text-andromeda-light">
          Your key, your book.
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          Read, own and collect literary works on-chain.
        </h1>
        <p className="max-w-2xl text-lg text-white/70">
          Andromeda turns every book into an author-certified NFT. Writers
          publish and sell directly to readers, and readers truly own the
          editions they buy.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Author-certified",
            body: "Every work is cryptographically signed by its author.",
          },
          {
            title: "Truly owned",
            body: "Each copy is an NFT you can read, keep and collect.",
          },
          {
            title: "Direct sales",
            body: "Writers reach readers without intermediaries.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="font-semibold text-andromeda-light">{card.title}</h2>
            <p className="mt-2 text-sm text-white/60">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-white/10 pt-8">
        <blockquote className="max-w-2xl space-y-3">
          <p className="text-lg italic text-white/80">
            — non si fa l&apos;arte per sentirsi dare del poeta, ma perché la
            si ama, semplicemente
          </p>
          <footer className="text-sm not-italic text-white/50">
            (Alda Merini)
          </footer>
        </blockquote>
      </section>
    </div>
  );
}
