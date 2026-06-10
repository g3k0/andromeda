import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { AUTHOR_DISPLAY_NAME_MAX_LENGTH } from "@/lib/authors/field-limits";
import type { AuthorProfile } from "@/lib/authors/types";
import { AuthorAvatar } from "./AuthorAvatar";
import {
  AVATAR_UPLOAD_MIME_ACCEPT,
  getAuthorAvatarUploadGuidance,
} from "./author-avatar-upload-guidance";
import type { EditorFormState } from "./author-profile-editor-state";

export type AuthorProfileEditorViewProps = {
  profile: AuthorProfile;
  form: EditorFormState;
  isAdminEditingOther: boolean;
  onDisplayNameChange: (value: string) => void;
  onAvatarFileSelect: (file: File | undefined) => void;
  onSubmit: () => void;
  onCancel: () => void;
  cancelLabel?: string;
};

export function AuthorProfileEditorView({
  profile,
  form,
  isAdminEditingOther,
  onDisplayNameChange,
  onAvatarFileSelect,
  onSubmit,
  onCancel,
  cancelLabel = "Cancel",
}: AuthorProfileEditorViewProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex max-w-lg flex-col items-center gap-4 text-center sm:items-start sm:text-left"
    >
      {isAdminEditingOther ? (
        <p className="rounded-lg border border-andromeda-light/30 bg-andromeda/10 px-3 py-1 text-xs font-medium text-andromeda-light">
          Editing as administrator
        </p>
      ) : null}

      <AuthorAvatar
        avatarUrl={form.avatarUrl}
        alt={form.displayName || profile.displayName}
      />

      <label
        htmlFor="author-display-name"
        className="w-full space-y-1 text-left"
      >
        <span className="text-sm text-white/60">Author name</span>
        <input
          id="author-display-name"
          type="text"
          value={form.displayName}
          maxLength={AUTHOR_DISPLAY_NAME_MAX_LENGTH}
          aria-invalid={form.displayNameError ? true : undefined}
          aria-describedby={
            form.displayNameError ? "author-display-name-error" : undefined
          }
          onChange={(event) => onDisplayNameChange(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-andromeda-light/50 aria-invalid:border-red-400/60"
        />
        {form.displayNameError ? (
          <p
            id="author-display-name-error"
            className="text-xs text-red-400"
            role="alert"
          >
            {form.displayNameError}
          </p>
        ) : null}
      </label>

      <div className="w-full space-y-4">
        <div className="space-y-1 text-left">
          <label className="block space-y-1">
            <span className="text-sm text-white/60">Profile image</span>
            <input
              type="file"
              accept={AVATAR_UPLOAD_MIME_ACCEPT}
              aria-invalid={form.avatarError ? true : undefined}
              aria-describedby={
                form.avatarError ? "author-profile-image-error" : undefined
              }
              onChange={(event) => onAvatarFileSelect(event.target.files?.[0])}
              className="w-full text-sm text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-andromeda file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white aria-invalid:outline aria-invalid:outline-1 aria-invalid:outline-red-400/60"
            />
          </label>
          <p className="text-xs leading-relaxed text-white/50">
            {getAuthorAvatarUploadGuidance()}
          </p>
          {form.avatarError ? (
            <p
              id="author-profile-image-error"
              className="text-xs text-red-400"
              role="alert"
            >
              {form.avatarError}
            </p>
          ) : null}
        </div>

        <div className="space-y-1 text-left">
          <span className="text-sm text-white/60">Public address</span>
          <p className="break-all font-mono text-sm text-white/60">
            {profile.address}
          </p>
        </div>

        {form.errorMessage ? (
          <p className="text-sm text-red-400" role="alert">
            {form.errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={form.isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark disabled:opacity-50"
          >
            {form.isSaving ? (
              <LoadingSpinner size="sm" label="Saving profile" />
            ) : null}
            {form.isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={form.isSaving}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
