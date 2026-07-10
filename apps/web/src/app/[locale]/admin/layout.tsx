import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAdminLayoutAuth } from "@/lib/auth/resolve-admin-layout-auth";
import { RouteGuard } from "@/components/navigation/RouteGuard";

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
    redirect("/");
  }

  return <RouteGuard routeId="admin">{children}</RouteGuard>;
}
