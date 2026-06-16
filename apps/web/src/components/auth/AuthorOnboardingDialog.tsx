"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDisconnect, useSignMessage } from "wagmi";
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

type AuthorOnboardingDialogFlowProps = {
  address: string;
  onNavigate: (path: string) => void;
};

function AuthorOnboardingDialogFlow({
  address,
  onNavigate,
}: AuthorOnboardingDialogFlowProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const { signMessageAsync } = useSignMessage();
  const { applySnapshot } = useUserSnapshot();
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
      const { snapshot: nextSnapshot } = await setWalletPreferencesAction({
        ...signed,
        declinedAuthorPage: true,
      });
      applySnapshot(nextSnapshot);
      requestUserSnapshotRefresh(nextSnapshot);
    }, "Saving your preference…");

  const handleCancel = () => {
    disconnect();
  };

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

export function AuthorOnboardingDialog({
  address,
  isConnected,
  onNavigate,
}: AuthorOnboardingDialogProps) {
  const { snapshot } = useUserSnapshot();

  const onboardingSnapshot = snapshot
    ? toAuthorOnboardingSnapshot(snapshot)
    : null;
  const open = resolveAuthorOnboardingDialogState(
    address,
    isConnected,
    onboardingSnapshot,
  ).open;

  if (!address || !open) {
    return null;
  }

  return (
    <AuthorOnboardingDialogFlow address={address} onNavigate={onNavigate} />
  );
}
