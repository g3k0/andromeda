"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { LoadingPanel } from "@/components/loading/LoadingPanel";
import { WalletButton } from "@/components/WalletButton";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import { useTranslation } from "@/lib/i18n/use-translation";
import { toAuthorOnboardingSnapshot } from "@/lib/authors/onboarding-snapshot";
import { resolveAuthorIndexPage } from "@/lib/authors/author-index";
import { useUserSnapshot } from "@/lib/users/use-user-snapshot";
import { AuthorPageStatusMessage } from "./AuthorPageStatusMessage";

export function AuthorIndexPage() {
  const router = useRouter();
  const localizedHref = useLocalizedHref();
  const { t } = useTranslation();
  const redirectedToRef = useRef<string | null>(null);
  const { snapshot } = useUserSnapshot();
  const resolved = resolveAuthorIndexPage(
    snapshot ? toAuthorOnboardingSnapshot(snapshot) : null,
  );

  if (resolved.status === "redirect") {
    if (redirectedToRef.current !== resolved.path) {
      redirectedToRef.current = resolved.path;
      router.replace(localizedHref(resolved.path));
    }

    return <LoadingPanel label={t("authorProfile.loadingPage")} />;
  }

  if (!snapshot) {
    return <LoadingPanel label={t("authorProfile.loadingPage")} />;
  }

  if (resolved.status === "connect_wallet") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-xl font-semibold">{t("authorProfile.indexTitle")}</h1>
        <p className="mt-2 text-sm text-white/60">
          {t("authorProfile.indexConnectWallet")}
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
        title={t("authorProfile.onboardingTitle")}
        description={t("authorProfile.onboardingDescription")}
      />
    );
  }

  return (
    <AuthorPageStatusMessage
      title={t("authorProfile.readerModeTitle")}
      description={t("authorProfile.readerModeDescription")}
    />
  );
}
