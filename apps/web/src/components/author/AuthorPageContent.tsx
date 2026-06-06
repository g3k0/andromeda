"use client";

import { useState } from "react";
import { useSignMessage } from "wagmi";
import { updateAuthorAction } from "@/app/actions/authors";
import { useLoading } from "@/components/loading/LoadingProvider";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import type { AuthorProfile } from "@/lib/authors/types";
import {
  isAdminEditingOtherAuthorPage,
  resolveCanEditAuthorPage,
} from "./author-page-content";
import { AuthorPageContentView } from "./AuthorPageContentView";
import type { AuthorProfileEditorSaveInput } from "./author-profile-editor-state";

export type AuthorPageContentProps = {
  profile: AuthorProfile;
  viewerAddress: string | null | undefined;
  isConnected: boolean;
  isAdmin: boolean;
  onProfileSaved?: (profile: AuthorProfile) => void;
};

export function AuthorPageContent({
  profile: initialProfile,
  viewerAddress,
  isConnected,
  isAdmin,
  onProfileSaved,
}: AuthorPageContentProps) {
  const { signMessageAsync } = useSignMessage();
  const { runWithLoading } = useLoading();
  const [profile, setProfile] = useState(initialProfile);

  const canEdit = resolveCanEditAuthorPage({
    viewerAddress,
    isConnected,
    isAdmin,
    profileOwnerAddress: profile.address,
  });

  const isAdminEditingOther = isAdminEditingOtherAuthorPage({
    viewerAddress,
    isAdmin,
    profileOwnerAddress: profile.address,
  });

  async function handleSave(input: AuthorProfileEditorSaveInput) {
    if (!viewerAddress) {
      return;
    }

    try {
      await runWithLoading(async () => {
        const signed = await createSignedWalletPayload(
          viewerAddress,
          signMessageAsync,
        );
        const updated = await updateAuthorAction({
          ...signed,
          targetAddress: profile.address,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
        });
        setProfile(updated);
        onProfileSaved?.(updated);
      }, "Saving profile…");
    } catch {
      // Errors surface via server action validation/auth failures.
    }
  }

  return (
    <AuthorPageContentView
      profile={profile}
      canEdit={canEdit}
      isAdminEditingOther={isAdminEditingOther}
      onSave={handleSave}
    />
  );
}
