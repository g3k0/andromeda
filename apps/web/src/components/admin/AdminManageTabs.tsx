"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { stripLocalePrefix } from "@/lib/i18n/routing";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";

const MANAGE_TABS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" },
] as const;

export function AdminManageTabs() {
  const pathname = usePathname();
  const localizedHref = useLocalizedHref();
  const logicalPathname = stripLocalePrefix(pathname);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage users and roles</h1>
        <p className="text-sm text-white/60">
          Manage platform accounts, roles and permissions.
        </p>
      </div>

      <nav
        aria-label="Admin management sections"
        className="flex gap-2 border-b border-white/10"
      >
        {MANAGE_TABS.map((tab) => {
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
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
