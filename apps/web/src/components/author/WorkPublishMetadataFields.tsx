import { FormFileControl } from "@/components/form/FormFileControl";
import { FormTextControl } from "@/components/form/FormTextControl";
import { FormTextareaControl } from "@/components/form/FormTextareaControl";
import { WORK_MANUSCRIPT_UPLOAD_ACCEPT } from "@/lib/works/manuscript-upload-guidance";
import { WORK_PUBLISH_FORM_GUIDANCE } from "@/lib/works/work-publish-form-guidance";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
} from "@/lib/works/work-publish-form-state";
import { ALLOWED_WORK_COVER_MIME_TYPES } from "@/lib/works/upload-limits";
import {
  WORK_PUBLISH_DESCRIPTION_MAX_LENGTH,
  WORK_PUBLISH_NAME_MAX_LENGTH,
} from "@/lib/works/work-publish-field-validation";

export type WorkPublishMetadataFieldsProps = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
  disabled: boolean;
  coverImageName: string | null;
  manuscriptFileName: string | null;
  onFieldChange: (field: keyof WorkPublishFormValues, value: string) => void;
  onCoverImageChange: (file: File | undefined) => void;
  onManuscriptFileChange: (file: File | undefined) => void;
};

export function WorkPublishMetadataFields({
  values,
  errors,
  disabled,
  coverImageName,
  manuscriptFileName,
  onFieldChange,
  onCoverImageChange,
  onManuscriptFileChange,
}: WorkPublishMetadataFieldsProps) {
  return (
    <>
      <FormTextControl
        id="publish-work-title-input"
        name="name"
        label="Title"
        required
        tooltipId="publish-work-title-tooltip"
        tooltip={WORK_PUBLISH_FORM_GUIDANCE.title}
        error={errors.name}
        type="text"
        value={values.name}
        maxLength={WORK_PUBLISH_NAME_MAX_LENGTH}
        disabled={disabled}
        onChange={(event) => onFieldChange("name", event.target.value)}
      />

      <FormTextareaControl
        id="publish-work-description"
        name="description"
        label="Description"
        required
        tooltipId="publish-work-description-tooltip"
        tooltip={WORK_PUBLISH_FORM_GUIDANCE.description}
        error={errors.description}
        value={values.description}
        maxLength={WORK_PUBLISH_DESCRIPTION_MAX_LENGTH}
        disabled={disabled}
        rows={3}
        onChange={(event) => onFieldChange("description", event.target.value)}
      />

      <FormFileControl
        id="publish-work-manuscript"
        name="manuscriptFile"
        label="Manuscript file"
        required
        tooltipId="publish-work-manuscript-tooltip"
        tooltip={WORK_PUBLISH_FORM_GUIDANCE.manuscript}
        error={errors.manuscriptFile}
        accept={WORK_MANUSCRIPT_UPLOAD_ACCEPT}
        disabled={disabled}
        selectedFileName={manuscriptFileName}
        onChange={(event) => onManuscriptFileChange(event.target.files?.[0])}
      />

      <FormFileControl
        id="publish-work-cover"
        name="coverImage"
        label="Cover image"
        required
        tooltipId="publish-work-cover-tooltip"
        tooltip={WORK_PUBLISH_FORM_GUIDANCE.cover}
        error={errors.coverImage}
        accept={ALLOWED_WORK_COVER_MIME_TYPES.join(",")}
        disabled={disabled}
        selectedFileName={coverImageName}
        onChange={(event) => onCoverImageChange(event.target.files?.[0])}
      />
    </>
  );
}
