"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { revokeWalletSessionAction } from "@/app/actions/wallet-session";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import { useLocale } from "@/lib/i18n/use-locale";
import { buildHeaderNavLinks } from "@/lib/navigation/header-nav";
import { useTranslation } from "@/lib/i18n/use-translation";
import { WALLET_DISCONNECTED_MESSAGE_KEY } from "@/lib/notifications/messages";
import { useUserSnapshot } from "@/lib/users/use-user-snapshot";
import { RoleMenuDropdown } from "@/components/RoleMenuDropdown";

export function SiteHeaderNav() {
  const router = useRouter();
  const locale = useLocale();
  const localizedHref = useLocalizedHref();
  const { notify } = useNotifications();
  const { t } = useTranslation();
  const { snapshot } = useUserSnapshot();
  const { disconnect, isPending: isLoggingOut } = useDisconnect({
    mutation: {
      onSuccess: () => {
        notify({
          variant: "info",
          message: t(WALLET_DISCONNECTED_MESSAGE_KEY),
        });
        router.push(localizedHref("/"));
      },
    },
  });

  const links = buildHeaderNavLinks({
    role: snapshot?.roleSlug ?? "reader",
    hasAuthorProfile: snapshot?.hasAuthorProfile ?? false,
    isConnected: snapshot?.isConnected ?? false,
    snapshot,
  }, locale);

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
          hasAuthorProfile={snapshot.hasAuthorProfile}
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
