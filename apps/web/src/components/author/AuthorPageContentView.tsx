import type { AuthorProfile } from "@/lib/authors/types";
import type { AuthorProfileEditorSaveInput } from "./author-profile-editor-state";
import type { AuthorPageViewState } from "./author-page-content";
import { AuthorProfileEditor } from "./AuthorProfileEditor";
import { AuthorProfileView } from "./AuthorProfileView";

type AuthorPageContentViewBaseProps = {
  profile: AuthorProfile;
};

type AuthorPageContentReadOnlyProps = AuthorPageContentViewBaseProps & {
  viewState: Extract<AuthorPageViewState, { variant: "read-only" }>;
  onEditClick: () => void;
};

type AuthorPageContentEditProps = AuthorPageContentViewBaseProps & {
  viewState: Extract<AuthorPageViewState, { variant: "edit" }>;
  onCancelEdit: () => void;
  onSave: (input: AuthorProfileEditorSaveInput) => void | Promise<void>;
};

export type AuthorPageContentViewProps =
  | AuthorPageContentReadOnlyProps
  | AuthorPageContentEditProps;

export function AuthorPageContentView(props: AuthorPageContentViewProps) {
  if (props.viewState.variant === "edit") {
    return (
      <AuthorProfileEditor
        profile={props.profile}
        isAdminEditingOther={props.viewState.audience === "admin"}
        onSave={props.onSave}
        onCancel={props.onCancelEdit}
      />
    );
  }

  return (
    <AuthorProfileView
      profile={props.profile}
      audience={props.viewState.audience}
      onEditClick={props.onEditClick}
    />
  );
}
