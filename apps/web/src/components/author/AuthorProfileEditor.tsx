"use client";

import { useState } from "react";
import type { AuthorProfile } from "@/lib/authors/types";
import {
  buildSavePayload,
  createEditorFormState,
  resetEditorFormState,
  type AuthorProfileEditorSaveInput,
  type EditorFormState,
} from "./author-profile-editor-state";
import { AuthorProfileEditorView } from "./AuthorProfileEditorView";
import {
  InvalidAvatarFileError,
  readAvatarAsDataUrl,
} from "./avatar-upload";

export type { AuthorProfileEditorSaveInput } from "./author-profile-editor-state";

export type AuthorProfileEditorProps = {
  profile: AuthorProfile;
  isAdminEditingOther: boolean;
  onSave: (input: AuthorProfileEditorSaveInput) => void | Promise<void>;
  onCancel?: () => void;
  cancelLabel?: string;
};

export function AuthorProfileEditor({
  profile,
  isAdminEditingOther,
  onSave,
  onCancel,
  cancelLabel,
}: AuthorProfileEditorProps) {
  const [form, setForm] = useState<EditorFormState>(() =>
    createEditorFormState(profile),
  );

  async function handleAvatarFileSelect(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readAvatarAsDataUrl(file);
      setForm((current) => ({
        ...current,
        avatarUrl: dataUrl,
        errorMessage: null,
      }));
    } catch (error) {
      setForm((current) => ({
        ...current,
        errorMessage:
          error instanceof InvalidAvatarFileError
            ? error.message
            : "Failed to upload image.",
      }));
    }
  }

  async function handleSubmit() {
    const result = buildSavePayload(form);
    if (!result.payload) {
      setForm((current) => ({ ...current, errorMessage: result.error }));
      return;
    }

    setForm((current) => ({ ...current, isSaving: true, errorMessage: null }));
    try {
      await onSave(result.payload);
    } catch {
      setForm((current) => ({
        ...current,
        errorMessage: "Failed to save profile.",
      }));
    } finally {
      setForm((current) => ({ ...current, isSaving: false }));
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
      return;
    }

    setForm(resetEditorFormState(profile));
  }

  return (
    <AuthorProfileEditorView
      profile={profile}
      form={form}
      isAdminEditingOther={isAdminEditingOther}
      onDisplayNameChange={(displayName) =>
        setForm((current) => ({ ...current, displayName }))
      }
      onAvatarFileSelect={(file) => void handleAvatarFileSelect(file)}
      onSubmit={() => void handleSubmit()}
      onCancel={handleCancel}
      cancelLabel={cancelLabel}
    />
  );
}
