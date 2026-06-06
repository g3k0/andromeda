"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { resolveAuthorIndexPage } from "@/lib/authors/author-index";
import { buildAuthorOnboardingSnapshot } from "@/lib/authors/onboarding";
import { AuthorPageStatusMessage } from "./AuthorPageStatusMessage";

export function AuthorIndexPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const snapshot = buildAuthorOnboardingSnapshot(address, isConnected);
  const resolved = resolveAuthorIndexPage(snapshot);

  useEffect(() => {
    if (resolved.status === "redirect") {
      router.replace(resolved.path);
    }
  }, [resolved, router]);

  if (resolved.status === "redirect") {
    return null;
  }

  if (resolved.status === "connect_wallet") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-xl font-semibold">Author page</h1>
        <p className="mt-2 text-sm text-white/60">
          Connect your wallet to open or create your author page.
        </p>
        <div className="mt-4 flex justify-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  if (resolved.status === "onboarding") {
    return (
      <AuthorPageStatusMessage
        title="Create your author page"
        description="Use the dialog to create your author page or continue as a reader."
      />
    );
  }

  return (
    <AuthorPageStatusMessage
      title="Reader mode"
      description="You are browsing as a reader. You can create an author page later from the onboarding prompt when you connect."
    />
  );
}
