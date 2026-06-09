import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveWalletAuth } from "@/lib/auth/resolve-wallet-auth";
import { WALLET_SESSION_COOKIE_NAME } from "@/lib/auth/wallet-session-cookies";
import { RouteGuard } from "@/components/navigation/RouteGuard";
import { assertCanAccessAdmin } from "@/lib/users/authorize";
import { getUserService } from "@/lib/users/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(WALLET_SESSION_COOKIE_NAME)?.value;

  try {
    const signer = await resolveWalletAuth({
      sessionId,
      walletAuth: null,
      cookieHeader: cookieStore.toString(),
    });
    const service = await getUserService();
    service.assertActive(signer);
    assertCanAccessAdmin(signer);
  } catch {
    redirect("/");
  }

  return <RouteGuard routeId="admin">{children}</RouteGuard>;
}
