"use client";

import { FormFileControl } from "@/components/form/FormFileControl";
import { FormTextControl } from "@/components/form/FormTextControl";
import {
  getPublishCoverGuidance,
  getPublishManuscriptGuidance,
  getPublishTitleGuidance,
} from "@/lib/i18n/publish-messages";
import { useTranslation } from "@/lib/i18n/use-translation";
import { WORK_MANUSCRIPT_UPLOAD_ACCEPT } from "@/lib/works/manuscript-upload-guidance";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
} from "@/lib/works/work-publish-form-state";
import { ALLOWED_WORK_COVER_MIME_TYPES } from "@/lib/works/upload-limits";
import { WORK_PUBLISH_NAME_MAX_LENGTH } from "@/lib/works/work-publish-field-validation";

import { WorkPublishImprintSection } from "./WorkPublishImprintSection";

export type WorkPublishMetadataFieldsProps = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
  authorAddress: string;
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
  authorAddress,
  disabled,
  coverImageName,
  manuscriptFileName,
  onFieldChange,
  onCoverImageChange,
  onManuscriptFileChange,
}: WorkPublishMetadataFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <FormTextControl
        id="publish-work-title-input"
        name="name"
        label={t("publish.fields.title.label")}
        required
        tooltipId="publish-work-title-tooltip"
        tooltip={getPublishTitleGuidance(t)}
        error={errors.name}
        type="text"
        value={values.name}
        maxLength={WORK_PUBLISH_NAME_MAX_LENGTH}
        disabled={disabled}
        onChange={(event) => onFieldChange("name", event.target.value)}
      />

      <WorkPublishImprintSection
        values={values}
        errors={errors}
        authorAddress={authorAddress}
        disabled={disabled}
        onFieldChange={onFieldChange}
      />

      <FormFileControl
        id="publish-work-manuscript"
        name="manuscriptFile"
        label={t("publish.fields.manuscriptFile.label")}
        required
        tooltipId="publish-work-manuscript-tooltip"
        tooltip={getPublishManuscriptGuidance(t)}
        error={errors.manuscriptFile}
        accept={WORK_MANUSCRIPT_UPLOAD_ACCEPT}
        disabled={disabled}
        selectedFileName={manuscriptFileName}
        onChange={(event) => onManuscriptFileChange(event.target.files?.[0])}
      />

      <FormFileControl
        id="publish-work-cover"
        name="coverImage"
        label={t("publish.fields.coverImage.label")}
        required
        tooltipId="publish-work-cover-tooltip"
        tooltip={getPublishCoverGuidance(t)}
        error={errors.coverImage}
        accept={ALLOWED_WORK_COVER_MIME_TYPES.join(",")}
        disabled={disabled}
        selectedFileName={coverImageName}
        onChange={(event) => onCoverImageChange(event.target.files?.[0])}
      />
    </>
  );
}
