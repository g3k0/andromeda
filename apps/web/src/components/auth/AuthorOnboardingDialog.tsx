"use client";

import { useEffect, useState } from "react";
import { useSignMessage } from "wagmi";
import { createAuthorAction, setWalletPreferencesAction } from "@/app/actions/authors";
import { useLoading } from "@/components/loading/LoadingProvider";
import { getAuthorOnboardingSnapshotAction } from "@/app/actions/onboarding";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import type { AuthorOnboardingSnapshot } from "@/lib/authors/onboarding";
import { authorPagePath } from "@/lib/authors/onboarding";
import { CreateAuthorPrompt } from "./CreateAuthorPrompt";
import { resolveAuthorOnboardingDialogState } from "./author-onboarding-dialog-state";

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
  const { signMessageAsync } = useSignMessage();
  const [snapshot, setSnapshot] = useState<AuthorOnboardingSnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const { isLoading, runWithLoading } = useLoading();

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      const nextSnapshot = await getAuthorOnboardingSnapshotAction(
        address,
        isConnected,
      );
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

  if (!address) {
    return null;
  }

  const handleAccept = () =>
    void runWithLoading(async () => {
      const signed = await createSignedWalletPayload(address, signMessageAsync);
      await createAuthorAction(signed);
      setOpen(false);
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

  return (
    <CreateAuthorPrompt
      open={open}
      onAccept={handleAccept}
      onDecline={handleDecline}
      loading={isLoading}
    />
  );
}
