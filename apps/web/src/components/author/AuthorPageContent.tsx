"use client";

import { useState } from "react";
import { upsertAuthor } from "@/lib/authors/mock-store";
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
  saveProfile?: typeof upsertAuthor;
};

export function AuthorPageContent({
  profile: initialProfile,
  viewerAddress,
  isConnected,
  isAdmin,
  onProfileSaved,
  saveProfile = upsertAuthor,
}: AuthorPageContentProps) {
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
    const updated = saveProfile({
      ...profile,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
    });
    setProfile(updated);
    onProfileSaved?.(updated);
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
