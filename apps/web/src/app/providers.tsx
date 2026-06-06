"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { AuthorOnboarding } from "@/components/auth/AuthorOnboarding";
import { LoadingProvider } from "@/components/loading/LoadingProvider";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <NotificationProvider>
            <AuthorOnboarding />
            {children}
          </NotificationProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
