import type { AuthorProfile } from "@/lib/authors/types";
import type { AuthorProfileEditorSaveInput } from "./author-profile-editor-state";
import { AuthorProfileEditor } from "./AuthorProfileEditor";
import { AuthorProfileView } from "./AuthorProfileView";

export type AuthorPageContentViewProps = {
  profile: AuthorProfile;
  canEdit: boolean;
  isAdminEditingOther: boolean;
  isProfileOwner: boolean;
  isEditing: boolean;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSave: (input: AuthorProfileEditorSaveInput) => boolean | Promise<boolean>;
};

export function AuthorPageContentView({
  profile,
  canEdit,
  isAdminEditingOther,
  isProfileOwner,
  isEditing,
  onEditClick,
  onCancelEdit,
  onSave,
}: AuthorPageContentViewProps) {
  if (isEditing && canEdit) {
    return (
      <AuthorProfileEditor
        profile={profile}
        isAdminEditingOther={isAdminEditingOther}
        onSave={onSave}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <AuthorProfileView
      profile={profile}
      showEditButton={isProfileOwner}
      onEditClick={onEditClick}
      showPublishWorkLink={isProfileOwner}
    />
  );
}
