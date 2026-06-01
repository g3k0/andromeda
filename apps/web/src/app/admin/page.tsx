export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-white/60">
          Manage works, authors and platform settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Works", body: "Review and curate published works." },
          { title: "Authors", body: "Verify and manage author certifications." },
          { title: "Sales", body: "Monitor minted copies and revenue." },
          { title: "Settings", body: "Configure platform parameters." },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="font-semibold text-andromeda-light">{card.title}</h2>
            <p className="mt-2 text-sm text-white/60">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
