import { AuthorProfileEditor } from "@/components/author/AuthorProfileEditor";
import type { AuthorProfileEditorSaveInput } from "@/components/author/author-profile-editor-state";
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
  return (
    <dialog
      ref={openModalDialog}
      aria-labelledby="author-onboarding-editor-title"
      className="w-[calc(100%-3rem)] max-w-lg space-y-6 rounded-xl border border-white/10 bg-[#0b0710] p-8 shadow-xl backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onBack();
      }}
    >
      <div className="space-y-2 text-center">
        <h2
          id="author-onboarding-editor-title"
          className="text-xl font-semibold tracking-tight"
        >
          Create your author page
        </h2>
        <p className="text-sm text-white/60">
          Customize your profile before publishing it on Andromeda.
        </p>
      </div>

      <AuthorProfileEditor
        profile={profile}
        isAdminEditingOther={false}
        onSave={onSave}
        onCancel={onBack}
        cancelLabel="Back"
      />
    </dialog>
  );
}
