"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { AuthorOnboarding } from "@/components/auth/AuthorOnboarding";
import { WalletBindingBootstrap } from "@/components/auth/WalletBindingBootstrap";
import { LoadingProvider } from "@/components/loading/LoadingProvider";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import type { SupportedLocale } from "@/lib/i18n/locales";
import { UserSnapshotProvider } from "@/lib/users/use-user-snapshot";

export function Providers({
  children,
  locale,
}: {
  children: ReactNode;
  locale: SupportedLocale;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale={locale}>
          <LoadingProvider>
            <NotificationProvider>
              <UserSnapshotProvider>
                <WalletBindingBootstrap />
                <AuthorOnboarding />
                {children}
              </UserSnapshotProvider>
            </NotificationProvider>
          </LoadingProvider>
        </I18nProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
