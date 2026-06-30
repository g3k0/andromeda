"use client";

import { useState } from "react";
import { useSignMessage } from "wagmi";
import { updateAuthorAction } from "@/app/actions/authors";
import { useLoading } from "@/components/loading/LoadingProvider";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import type { AuthorProfile } from "@/lib/authors/types";
import type { UserRole } from "@/lib/users/types";
import {
  isAdminEditingOtherAuthorPage,
  isAuthorProfileOwner,
  resolveAuthorPageViewState,
  resolveCanEditAuthorPage,
} from "./author-page-content";
import { AuthorPageContentView } from "./AuthorPageContentView";
import type { AuthorProfileEditorSaveInput } from "./author-profile-editor-state";

export type AuthorPageContentProps = {
  profile: AuthorProfile;
  viewerAddress: string | null | undefined;
  isConnected: boolean;
  isAdmin: boolean;
  viewerRole?: UserRole | null;
  onProfileSaved?: (profile: AuthorProfile) => void;
};

export function AuthorPageContent({
  profile: initialProfile,
  viewerAddress,
  isConnected,
  isAdmin,
  viewerRole,
  onProfileSaved,
}: AuthorPageContentProps) {
  const { signMessageAsync } = useSignMessage();
  const { runWithLoading } = useLoading();
  const [profile, setProfile] = useState(initialProfile);

  const canEdit = resolveCanEditAuthorPage({
    viewerAddress,
    isConnected,
    isAdmin,
    viewerRole,
    profileOwnerAddress: profile.address,
  });

  const isAdminEditingOther = isAdminEditingOtherAuthorPage({
    viewerAddress,
    isAdmin,
    viewerRole,
    profileOwnerAddress: profile.address,
  });

  const isProfileOwner = isAuthorProfileOwner({
    viewerAddress,
    isConnected,
    isAdmin,
    viewerRole,
    profileOwnerAddress: profile.address,
  });

  const [isEditing, setIsEditing] = useState(isAdminEditingOther);

  const viewState = resolveAuthorPageViewState({
    canEdit,
    isAdminEditingOther,
    isProfileOwner,
    isEditing,
  });

  async function handleSave(input: AuthorProfileEditorSaveInput): Promise<void> {
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
          bio: input.bio,
        });
        setProfile(updated);
        onProfileSaved?.(updated);
      }, "Saving profile…");
      setIsEditing(false);
    } catch {
      // Errors surface via server action validation/auth failures.
    }
  }

  if (viewState.variant === "edit") {
    return (
      <AuthorPageContentView
        profile={profile}
        variant="edit"
        audience={viewState.audience}
        onCancelEdit={() => setIsEditing(false)}
        onSave={handleSave}
      />
    );
  }

  return (
    <AuthorPageContentView
      profile={profile}
      variant="read-only"
      audience={viewState.audience}
      onEditClick={() => setIsEditing(true)}
    />
  );
}
