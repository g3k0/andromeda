import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAdminLayoutAuth } from "@/lib/auth/resolve-admin-layout-auth";
import { RouteGuard } from "@/components/navigation/RouteGuard";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { localizedPath } from "@/lib/i18n/routing";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();

  let isAuthorized = false;
  try {
    await resolveAdminLayoutAuth(cookieStore.toString());
    isAuthorized = true;
  } catch {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    const locale = await getRequestLocale();
    redirect(localizedPath(locale, "/"));
  }

  return <RouteGuard routeId="admin">{children}</RouteGuard>;
}
