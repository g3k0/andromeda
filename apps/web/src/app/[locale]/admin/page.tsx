import { LocalizedLink } from "@/lib/i18n/LocalizedLink";
import { MANAGE_USERS_PATH } from "@/lib/navigation/role-menu";

const ADMIN_CARDS = [
  {
    title: "Manage users and roles",
    body: "Manage platform accounts, roles and status.",
    href: MANAGE_USERS_PATH,
  },
  {
    title: "Works",
    body: "Review and curate published works.",
  },
  {
    title: "Authors",
    body: "Verify and manage author certifications.",
  },
  {
    title: "Sales",
    body: "Monitor minted copies and revenue.",
  },
  {
    title: "Settings",
    body: "Configure platform parameters.",
  },
] as const;

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
        {ADMIN_CARDS.map((card) => {
          const content = (
            <>
              <h2 className="font-semibold text-andromeda-light">{card.title}</h2>
              <p className="mt-2 text-sm text-white/60">{card.body}</p>
            </>
          );

          if ("href" in card && card.href) {
            return (
              <LocalizedLink
                key={card.title}
                href={card.href}
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-andromeda-light/40 hover:bg-white/10"
              >
                {content}
              </LocalizedLink>
            );
          }

          return (
            <div
              key={card.title}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
