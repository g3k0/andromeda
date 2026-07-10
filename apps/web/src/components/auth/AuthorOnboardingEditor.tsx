"use client";

import { AuthorProfileEditor } from "@/components/author/AuthorProfileEditor";
import type { AuthorProfileEditorSaveInput } from "@/components/author/author-profile-editor-state";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { AuthorProfile } from "@/lib/authors/types";

export type AuthorOnboardingEditorProps = {
  profile: AuthorProfile;
  onSave: (input: AuthorProfileEditorSaveInput) => void | Promise<void>;
  onBack: () => void;
};

function openModalDialog(dialog: HTMLDialogElement | null) {
  if (dialog && !dialog.open) {
    dialog.showModal();
  }
}

export function AuthorOnboardingEditor({
  profile,
  onSave,
  onBack,
}: AuthorOnboardingEditorProps) {
  const { t } = useTranslation();

  return (
    <dialog
      ref={openModalDialog}
      aria-labelledby="author-onboarding-editor-title"
      className="w-[calc(100%-3rem)] max-w-lg space-y-6 rounded-xl border border-white/10 bg-[#0b0710] p-8 text-white shadow-xl backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onBack();
      }}
    >
      <div className="space-y-2 text-center">
        <h2
          id="author-onboarding-editor-title"
          className="text-xl font-semibold tracking-tight text-white"
        >
          {t("authorOnboarding.editor.title")}
        </h2>
        <p className="text-sm text-white/60">
          {t("authorOnboarding.editor.description")}
        </p>
      </div>

      <AuthorProfileEditor
        profile={profile}
        isAdminEditingOther={false}
        onSave={onSave}
        onCancel={onBack}
        cancelLabel={t("authorOnboarding.editor.back")}
      />
    </dialog>
  );
}
