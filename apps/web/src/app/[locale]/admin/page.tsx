import { LocalizedLink } from "@/lib/i18n/LocalizedLink";
import { getServerTranslations } from "@/lib/i18n/server";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { MANAGE_USERS_PATH } from "@/lib/navigation/role-menu";

const ADMIN_CARD_KEYS = [
  { titleKey: "admin.dashboard.cards.manageUsers.title", bodyKey: "admin.dashboard.cards.manageUsers.body", href: MANAGE_USERS_PATH },
  { titleKey: "admin.dashboard.cards.works.title", bodyKey: "admin.dashboard.cards.works.body" },
  { titleKey: "admin.dashboard.cards.authors.title", bodyKey: "admin.dashboard.cards.authors.body" },
  { titleKey: "admin.dashboard.cards.sales.title", bodyKey: "admin.dashboard.cards.sales.body" },
  { titleKey: "admin.dashboard.cards.settings.title", bodyKey: "admin.dashboard.cards.settings.body" },
] as const;

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam)
    ? (localeParam as SupportedLocale)
    : "en";
  const { t } = getServerTranslations(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.dashboard.title")}</h1>
        <p className="text-sm text-white/60">{t("admin.dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ADMIN_CARD_KEYS.map((card) => {
          const content = (
            <>
              <h2 className="font-semibold text-andromeda-light">{t(card.titleKey)}</h2>
              <p className="mt-2 text-sm text-white/60">{t(card.bodyKey)}</p>
            </>
          );

          if ("href" in card && card.href) {
            return (
              <LocalizedLink
                key={card.titleKey}
                href={card.href}
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-andromeda-light/40 hover:bg-white/10"
              >
                {content}
              </LocalizedLink>
            );
          }

          return (
            <div
              key={card.titleKey}
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
