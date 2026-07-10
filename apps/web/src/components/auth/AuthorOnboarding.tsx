"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { AuthorOnboardingDialog } from "./AuthorOnboardingDialog";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";

export function AuthorOnboarding() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const localizedHref = useLocalizedHref();

  return (
    <AuthorOnboardingDialog
      address={address}
      isConnected={isConnected}
      onNavigate={(path) => router.push(localizedHref(path))}
    />
  );
}
