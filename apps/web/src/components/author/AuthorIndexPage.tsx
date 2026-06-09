"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingPanel } from "@/components/loading/LoadingPanel";
import { WalletButton } from "@/components/WalletButton";
import { toAuthorOnboardingSnapshot } from "@/lib/authors/onboarding-snapshot";
import { resolveAuthorIndexPage } from "@/lib/authors/author-index";
import { useUserSnapshot } from "@/lib/users/use-user-snapshot";
import { AuthorPageStatusMessage } from "./AuthorPageStatusMessage";

export function AuthorIndexPage() {
  const router = useRouter();
  const { snapshot } = useUserSnapshot();
  const resolved = resolveAuthorIndexPage(
    snapshot ? toAuthorOnboardingSnapshot(snapshot) : null,
  );

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
