export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
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
    </div>
  );
}
