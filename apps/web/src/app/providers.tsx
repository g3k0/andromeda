"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { AuthorOnboarding } from "@/components/auth/AuthorOnboarding";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AuthorOnboarding />
          {children}
        </NotificationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
