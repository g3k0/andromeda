import type { AuthorProfile } from "@/lib/authors/types";
import type { AuthorProfileEditorSaveInput } from "./author-profile-editor-state";
import { AuthorProfileEditor } from "./AuthorProfileEditor";
import { AuthorProfileView } from "./AuthorProfileView";

export type AuthorPageContentViewProps =
  | {
      profile: AuthorProfile;
      variant: "read-only";
      audience: "visitor" | "owner";
      onEditClick: () => void;
    }
  | {
      profile: AuthorProfile;
      variant: "edit";
      audience: "owner" | "admin";
      onCancelEdit: () => void;
      onSave: (input: AuthorProfileEditorSaveInput) => void | Promise<void>;
    };

export function AuthorPageContentView(props: AuthorPageContentViewProps) {
  if (props.variant === "edit") {
    return (
      <AuthorProfileEditor
        profile={props.profile}
        isAdminEditingOther={props.audience === "admin"}
        onSave={props.onSave}
        onCancel={props.onCancelEdit}
      />
    );
  }

  return (
    <AuthorProfileView
      profile={props.profile}
      audience={props.audience}
      onEditClick={props.onEditClick}
    />
  );
}
