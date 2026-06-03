"use client";

import { useEffect, useState } from "react";
import { CreateAuthorPrompt } from "./CreateAuthorPrompt";
import {
  handleAuthorOnboardingAccept,
  handleAuthorOnboardingDecline,
  resolveAuthorOnboardingDialogState,
} from "./author-onboarding-dialog-state";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(resolveAuthorOnboardingDialogState(address, isConnected).open);
  }, [address, isConnected]);

  if (!address) {
    return null;
  }

  const handleAccept = () => {
    const result = handleAuthorOnboardingAccept(address);
    setOpen(result.open);
    onNavigate(result.redirectPath);
  };

  const handleDecline = () => {
    const result = handleAuthorOnboardingDecline(address);
    setOpen(result.open);
  };

  return (
    <CreateAuthorPrompt
      open={open}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
}
