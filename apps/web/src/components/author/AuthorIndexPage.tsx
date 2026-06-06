"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { getAuthorOnboardingSnapshotAction } from "@/app/actions/onboarding";
import { LoadingPanel } from "@/components/loading/LoadingPanel";
import { WalletButton } from "@/components/WalletButton";
import type { AuthorOnboardingSnapshot } from "@/lib/authors/onboarding";
import { resolveAuthorIndexPage } from "@/lib/authors/author-index";
import { AuthorPageStatusMessage } from "./AuthorPageStatusMessage";

export function AuthorIndexPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<AuthorOnboardingSnapshot | null>(null);
  const resolved = resolveAuthorIndexPage(snapshot);

  useEffect(() => {
    let cancelled = false;

    void getAuthorOnboardingSnapshotAction(address, isConnected).then((next) => {
      if (!cancelled) {
        setSnapshot(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  useEffect(() => {
    if (resolved.status === "redirect") {
      router.replace(resolved.path);
    }
  }, [resolved, router]);

  if (!snapshot || resolved.status === "redirect") {
    return <LoadingPanel label="Loading author page…" />;
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
