"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDisconnect, useSignMessage } from "wagmi";
import { createAuthorAction, setWalletPreferencesAction } from "@/app/actions/authors";
import { getUserSnapshotAction } from "@/app/actions/users";
import { useLoading } from "@/components/loading/LoadingProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import type { AuthorProfileEditorSaveInput } from "@/components/author/author-profile-editor-state";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import {
  authorPagePath,
  buildDraftAuthorProfile,
} from "@/lib/authors/onboarding";
import { WALLET_DISCONNECTED_MESSAGE } from "@/lib/notifications/messages";
import { requestUserSnapshotRefresh } from "@/lib/users/user-snapshot-sync";
import type { UserSnapshot } from "@/lib/users/types";
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
  const [snapshot, setSnapshot] = useState<UserSnapshot | null>(null);
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      const nextSnapshot = await getUserSnapshotAction(address, isConnected);
      if (!cancelled) {
        setSnapshot(nextSnapshot);
        setOpen(
          resolveAuthorOnboardingDialogState(address, isConnected, nextSnapshot)
            .open,
        );
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

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
      await createAuthorAction({
        ...signed,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      });

      const nextSnapshot = await getUserSnapshotAction(address, isConnected);
      setSnapshot(nextSnapshot);
      setOpen(false);
      setStep("prompt");
      requestUserSnapshotRefresh();
      onNavigate(authorPagePath(address));
    }, "Creating author page…");

  const handleDecline = () =>
    void runWithLoading(async () => {
      const signed = await createSignedWalletPayload(address, signMessageAsync);
      await setWalletPreferencesAction({
        ...signed,
        declinedAuthorPage: true,
      });
      setOpen(false);
      setSnapshot((current) =>
        current
          ? { ...current, declinedAuthorPage: true }
          : current,
      );
    }, "Saving your preference…");

  const handleCancel = () => {
    setOpen(false);
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
