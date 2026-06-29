import type { AuthorProfile } from "@/lib/authors/types";
import type { AuthorProfileEditorSaveInput } from "./author-profile-editor-state";
import { AuthorProfileEditor } from "./AuthorProfileEditor";
import { AuthorProfileView } from "./AuthorProfileView";

export type AuthorPageContentViewProps = {
  profile: AuthorProfile;
  canEdit: boolean;
  isAdminEditingOther: boolean;
  onSave: (input: AuthorProfileEditorSaveInput) => void | Promise<void>;
};

export function AuthorPageContentView({
  profile,
  canEdit,
  isAdminEditingOther,
  onSave,
}: AuthorPageContentViewProps) {
  if (!canEdit) {
    return <AuthorProfileView profile={profile} />;
  }

  return (
    <AuthorProfileEditor
      profile={profile}
      isAdminEditingOther={isAdminEditingOther}
      showPublishWorkLink
      onSave={onSave}
    />
  );
}
