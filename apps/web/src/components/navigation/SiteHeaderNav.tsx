"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { revokeWalletSessionAction } from "@/app/actions/wallet-session";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { buildHeaderNavLinks } from "@/lib/navigation/header-nav";
import { WALLET_DISCONNECTED_MESSAGE } from "@/lib/notifications/messages";
import { useUserSnapshot } from "@/lib/users/use-user-snapshot";
import { RoleMenuDropdown } from "@/components/RoleMenuDropdown";

export function SiteHeaderNav() {
  const router = useRouter();
  const { notify } = useNotifications();
  const { snapshot } = useUserSnapshot();
  const { disconnect, isPending: isLoggingOut } = useDisconnect({
    mutation: {
      onSuccess: () => {
        notify({
          variant: "info",
          message: WALLET_DISCONNECTED_MESSAGE,
        });
        router.push("/");
      },
    },
  });

  const links = buildHeaderNavLinks({
    role: snapshot?.roleSlug ?? "reader",
    hasAuthorProfile: snapshot?.hasAuthorProfile ?? false,
    isConnected: snapshot?.isConnected ?? false,
    snapshot,
  });

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-white/70 hover:text-white"
        >
          {link.label}
        </Link>
      ))}

      {snapshot?.isConnected ? (
        <RoleMenuDropdown
          roleSlug={snapshot.roleSlug}
          roleName={snapshot.roleName}
          permissions={snapshot.permissions}
          onLogout={() => {
            void revokeWalletSessionAction();
            disconnect();
          }}
          isLoggingOut={isLoggingOut}
        />
      ) : null}
    </>
  );
}
