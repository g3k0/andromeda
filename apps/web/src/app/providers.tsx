"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { AuthorOnboarding } from "@/components/auth/AuthorOnboarding";
import { WalletBindingBootstrap } from "@/components/auth/WalletBindingBootstrap";
import { LoadingProvider } from "@/components/loading/LoadingProvider";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { UserSnapshotProvider } from "@/lib/users/use-user-snapshot";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <NotificationProvider>
            <UserSnapshotProvider>
              <WalletBindingBootstrap />
              <AuthorOnboarding />
              {children}
            </UserSnapshotProvider>
          </NotificationProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
