"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { getUserSnapshotAction } from "@/app/actions/users";
import { revokeWalletSessionAction } from "@/app/actions/wallet-session";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { buildHeaderNavLinks } from "@/lib/navigation/header-nav";
import { WALLET_DISCONNECTED_MESSAGE } from "@/lib/notifications/messages";
import { USER_SNAPSHOT_REFRESH_EVENT } from "@/lib/users/user-snapshot-sync";
import type { UserSnapshot } from "@/lib/users/types";
import { RoleMenuDropdown } from "@/components/RoleMenuDropdown";

export function SiteHeaderNav() {
  const router = useRouter();
  const { notify } = useNotifications();
  const { address, isConnected } = useAccount();
  const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      const next = await getUserSnapshotAction(address, isConnected);
      if (!cancelled) {
        setSnapshot(next);
      }
    }

    void loadSnapshot();

    function handleSnapshotRefresh() {
      void loadSnapshot();
    }

    window.addEventListener(USER_SNAPSHOT_REFRESH_EVENT, handleSnapshotRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(
        USER_SNAPSHOT_REFRESH_EVENT,
        handleSnapshotRefresh,
      );
    };
  }, [address, isConnected]);

  const links = buildHeaderNavLinks({
    role: snapshot?.roleSlug ?? "reader",
    hasAuthorProfile: snapshot?.hasAuthorProfile ?? false,
    isConnected,
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

      {isConnected && snapshot ? (
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
