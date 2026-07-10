"use client";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { useTranslation } from "@/lib/i18n/use-translation";

export type CreateAuthorPromptProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function openModalDialog(dialog: HTMLDialogElement | null) {
  if (dialog && !dialog.open) {
    dialog.showModal();
  }
}

export function CreateAuthorPrompt({
  open,
  onAccept,
  onDecline,
  onCancel,
  disabled = false,
  loading = false,
}: CreateAuthorPromptProps) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={openModalDialog}
      aria-labelledby="create-author-prompt-title"
      className="w-[calc(100%-3rem)] max-w-md space-y-6 rounded-xl border border-white/10 bg-[#0b0710] p-8 text-white shadow-xl backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="space-y-2 text-center">
        <h2
          id="create-author-prompt-title"
          className="text-xl font-semibold tracking-tight text-white"
        >
          {t("authorOnboarding.prompt.title")}
        </h2>
        <p className="text-sm text-white/60">
          {t("authorOnboarding.prompt.description")}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onAccept}
          disabled={disabled || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoadingSpinner size="sm" label={t("authorOnboarding.prompt.creating")} />
          ) : null}
          {t("authorOnboarding.prompt.accept")}
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={disabled || loading}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("authorOnboarding.prompt.decline")}
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled || loading}
          className="text-sm text-white/50 underline-offset-4 hover:text-white/70 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("authorOnboarding.prompt.cancel")}
        </button>
      </div>
    </dialog>
  );
}
