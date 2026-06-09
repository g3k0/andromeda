"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { createAuthorAction, setWalletPreferencesAction } from "@/app/actions/authors";
import { useLoading } from "@/components/loading/LoadingProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import type { AuthorProfileEditorSaveInput } from "@/components/author/author-profile-editor-state";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import { markWalletBound } from "@/lib/auth/wallet-binding-client";
import { toAuthorOnboardingSnapshot } from "@/lib/authors/onboarding-snapshot";
import {
  authorPagePath,
  buildDraftAuthorProfile,
} from "@/lib/authors/onboarding";
import { WALLET_DISCONNECTED_MESSAGE } from "@/lib/notifications/messages";
import { requestUserSnapshotRefresh } from "@/lib/users/user-snapshot-sync";
import { useUserSnapshot } from "@/lib/users/use-user-snapshot";
import { AuthorOnboardingEditor } from "./AuthorOnboardingEditor";
import { CreateAuthorPrompt } from "./CreateAuthorPrompt";
import { resolveAuthorOnboardingDialogState } from "./author-onboarding-dialog-state";

export type AuthorOnboardingStep = "prompt" | "editor";

export type AuthorOnboardingDialogProps = {
  address?: string;
  isConnected: boolean;
  onNavigate: (path: string) => void;
};

export function AuthorOnboardingDialog({
  address,
  isConnected,
  onNavigate,
}: AuthorOnboardingDialogProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const { signMessageAsync } = useSignMessage();
  const { snapshot, applySnapshot } = useUserSnapshot();
  const [step, setStep] = useState<AuthorOnboardingStep>("prompt");
  const { isLoading, runWithLoading } = useLoading();
  const { disconnect } = useDisconnect({
    mutation: {
      onSuccess: () => {
        notify({
          variant: "info",
          message: WALLET_DISCONNECTED_MESSAGE,
        });
        router.push("/");
      },
    },
  });

  const onboardingSnapshot = snapshot
    ? toAuthorOnboardingSnapshot(snapshot)
    : null;
  const open = resolveAuthorOnboardingDialogState(
    address,
    isConnected,
    onboardingSnapshot,
  ).open;

  useEffect(() => {
    if (!open) {
      setStep("prompt");
    }
  }, [open]);

  if (!address) {
    return null;
  }

  const handleAccept = () => {
    setStep("editor");
  };

  const handleSave = (input: AuthorProfileEditorSaveInput) =>
    void runWithLoading(async () => {
      const signed = await createSignedWalletPayload(address, signMessageAsync);
      const { snapshot: nextSnapshot } = await createAuthorAction({
        ...signed,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      });

      markWalletBound(address);
      applySnapshot(nextSnapshot);
      requestUserSnapshotRefresh(nextSnapshot);
      onNavigate(authorPagePath(address));
    }, "Creating author page…");

  const handleDecline = () =>
    void runWithLoading(async () => {
      const signed = await createSignedWalletPayload(address, signMessageAsync);
      await setWalletPreferencesAction({
        ...signed,
        declinedAuthorPage: true,
      });
      requestUserSnapshotRefresh();
    }, "Saving your preference…");

  const handleCancel = () => {
    disconnect();
  };

  if (!open) {
    return null;
  }

  if (step === "editor") {
    return (
      <AuthorOnboardingEditor
        profile={buildDraftAuthorProfile(address)}
        onSave={handleSave}
        onBack={() => setStep("prompt")}
      />
    );
  }

  return (
    <CreateAuthorPrompt
      open
      onAccept={handleAccept}
      onDecline={handleDecline}
      onCancel={handleCancel}
      loading={isLoading}
    />
  );
}
