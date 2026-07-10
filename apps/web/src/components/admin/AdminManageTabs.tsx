"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { stripLocalePrefix } from "@/lib/i18n/routing";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import { useTranslation } from "@/lib/i18n/use-translation";

const MANAGE_TAB_HREFS = [
  { href: "/admin/users", labelKey: "admin.tabs.users" },
  { href: "/admin/roles", labelKey: "admin.tabs.roles" },
] as const;

export function AdminManageTabs() {
  const pathname = usePathname();
  const localizedHref = useLocalizedHref();
  const { t } = useTranslation();
  const logicalPathname = stripLocalePrefix(pathname);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.manage.title")}</h1>
        <p className="text-sm text-white/60">{t("admin.manage.subtitle")}</p>
      </div>

      <nav
        aria-label={t("admin.tabs.ariaLabel")}
        className="flex gap-2 border-b border-white/10"
      >
        {MANAGE_TAB_HREFS.map((tab) => {
          const active = logicalPathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={localizedHref(tab.href)}
              aria-current={active ? "page" : undefined}
              className={[
                "border-b-2 px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-andromeda-light text-andromeda-light"
                  : "border-transparent text-white/60 hover:text-white",
              ].join(" ")}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
