"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { AuthorOnboardingDialog } from "./AuthorOnboardingDialog";

export function AuthorOnboarding() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  return (
    <AuthorOnboardingDialog
      address={address}
      isConnected={isConnected}
      onNavigate={(path) => router.push(path)}
    />
  );
}
