"use client";

import type { WorkPublishImprintFormValues } from "@/lib/works/work-imprint-metadata";
import {
  getPublishAboutAuthorGuidance,
  getPublishAuthorAddressGuidance,
  getPublishBackCoverTextGuidance,
  getPublishEditionKindGuidance,
  getPublishEditionNumberGuidance,
  getPublishLanguageGuidance,
  getPublishOriginalPublicationDateGuidance,
  getPublishPublicationDateGuidance,
  getPublishReprintNumberGuidance,
  getPublishSeriesNameGuidance,
  getPublishSeriesVolumeGuidance,
} from "@/lib/i18n/publish-messages";
import { useTranslation } from "@/lib/i18n/use-translation";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
} from "@/lib/works/work-publish-form-state";

import { FormFieldLabel } from "@/components/form/FormFieldLabel";
import { FormTextControl } from "@/components/form/FormTextControl";
import { FormTextareaControl } from "@/components/form/FormTextareaControl";
import {
  formErrorClassName,
  formSelectClassName,
  formTextInputClassName,
} from "@/components/form/form-field-styles";
import { formFieldDescribedBy, resolveFormFieldLabelId } from "@/components/form/form-field-utils";
import {
  WORK_PUBLISH_ABOUT_AUTHOR_MAX_LENGTH,
  WORK_PUBLISH_BACK_COVER_TEXT_MAX_LENGTH,
  WORK_PUBLISH_LANGUAGE_MAX_LENGTH,
  WORK_PUBLISH_SERIES_NAME_MAX_LENGTH,
} from "@/lib/works/work-imprint-metadata";

export type WorkPublishImprintSectionProps = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
  authorAddress: string;
  disabled: boolean;
  onFieldChange: (field: keyof WorkPublishFormValues, value: string) => void;
};

function imprintError(
  errors: WorkPublishFormErrors,
  field: keyof WorkPublishImprintFormValues,
): string | undefined {
  return errors[field];
}

export function WorkPublishImprintSection({
  values,
  errors,
  authorAddress,
  disabled,
  onFieldChange,
}: WorkPublishImprintSectionProps) {
  const { t } = useTranslation();
  const authorLabelId = resolveFormFieldLabelId("publish-work-author-address");

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-lg border border-white/10 p-4"
    >
      <legend className="px-1 text-sm font-medium text-white">
        {t("publish.sections.imprint.legend")}
      </legend>
      <p className="text-xs leading-relaxed text-white/50">
        {t("publish.sections.imprint.description")}
      </p>

      <FormTextControl
        id="publish-work-publication-date"
        name="publicationDate"
        label={t("publish.fields.publicationDate.label")}
        required
        tooltipId="publish-work-publication-date-tooltip"
        tooltip={getPublishPublicationDateGuidance(t)}
        error={imprintError(errors, "publicationDate")}
        type="date"
        value={values.publicationDate}
        onChange={(event) => onFieldChange("publicationDate", event.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextControl
          id="publish-work-edition-number"
          name="editionNumber"
          label={t("publish.fields.editionNumber.label")}
          required
          tooltipId="publish-work-edition-number-tooltip"
          tooltip={getPublishEditionNumberGuidance(t)}
          error={imprintError(errors, "editionNumber")}
          type="number"
          min={1}
          step={1}
          value={values.editionNumber}
          onChange={(event) => onFieldChange("editionNumber", event.target.value)}
        />

        <div className="space-y-1">
          <FormFieldLabel
            htmlFor="publish-work-edition-kind"
            labelId={resolveFormFieldLabelId("publish-work-edition-kind")}
            label={t("publish.fields.editionKind.label")}
            required
            tooltipId="publish-work-edition-kind-tooltip"
            tooltip={getPublishEditionKindGuidance(t)}
          />
          <select
            id="publish-work-edition-kind"
            name="editionKind"
            value={values.editionKind}
            aria-labelledby={resolveFormFieldLabelId("publish-work-edition-kind")}
            aria-required="true"
            aria-invalid={imprintError(errors, "editionKind") ? true : undefined}
            aria-describedby={formFieldDescribedBy(
              imprintError(errors, "editionKind"),
              "publish-work-edition-kind-error",
            )}
            onChange={(event) =>
              onFieldChange("editionKind", event.target.value as "first" | "reprint")
            }
            className={formSelectClassName}
          >
            <option value="first">{t("publish.fields.editionKind.options.first")}</option>
            <option value="reprint">{t("publish.fields.editionKind.options.reprint")}</option>
          </select>
          {imprintError(errors, "editionKind") ? (
            <p
              id="publish-work-edition-kind-error"
              className={formErrorClassName}
              role="alert"
            >
              {imprintError(errors, "editionKind")}
            </p>
          ) : null}
        </div>
      </div>

      {values.editionKind === "reprint" ? (
        <FormTextControl
          id="publish-work-reprint-number"
          name="reprintNumber"
          label={t("publish.fields.reprintNumber.label")}
          required
          tooltipId="publish-work-reprint-number-tooltip"
          tooltip={getPublishReprintNumberGuidance(t)}
          error={imprintError(errors, "reprintNumber")}
          type="number"
          min={1}
          step={1}
          value={values.reprintNumber}
          onChange={(event) => onFieldChange("reprintNumber", event.target.value)}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextControl
          id="publish-work-series-name"
          name="seriesName"
          label={t("publish.fields.seriesName.label")}
          tooltipId="publish-work-series-name-tooltip"
          tooltip={getPublishSeriesNameGuidance(t)}
          error={imprintError(errors, "seriesName")}
          type="text"
          maxLength={WORK_PUBLISH_SERIES_NAME_MAX_LENGTH}
          value={values.seriesName}
          onChange={(event) => onFieldChange("seriesName", event.target.value)}
        />

        <FormTextControl
          id="publish-work-series-volume"
          name="seriesVolume"
          label={t("publish.fields.seriesVolume.label")}
          tooltipId="publish-work-series-volume-tooltip"
          tooltip={getPublishSeriesVolumeGuidance(t)}
          error={imprintError(errors, "seriesVolume")}
          type="number"
          min={1}
          step={1}
          value={values.seriesVolume}
          onChange={(event) => onFieldChange("seriesVolume", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextControl
          id="publish-work-language"
          name="language"
          label={t("publish.fields.language.label")}
          tooltipId="publish-work-language-tooltip"
          tooltip={getPublishLanguageGuidance(t)}
          error={imprintError(errors, "language")}
          type="text"
          maxLength={WORK_PUBLISH_LANGUAGE_MAX_LENGTH}
          placeholder={t("publish.fields.language.placeholder")}
          value={values.language}
          onChange={(event) => onFieldChange("language", event.target.value)}
        />

        <FormTextControl
          id="publish-work-original-publication-date"
          name="originalPublicationDate"
          label={t("publish.fields.originalPublicationDate.label")}
          tooltipId="publish-work-original-publication-date-tooltip"
          tooltip={getPublishOriginalPublicationDateGuidance(t)}
          error={imprintError(errors, "originalPublicationDate")}
          type="date"
          value={values.originalPublicationDate}
          onChange={(event) =>
            onFieldChange("originalPublicationDate", event.target.value)
          }
        />
      </div>

      <FormTextareaControl
        id="publish-work-back-cover-text"
        name="backCoverText"
        label={t("publish.fields.backCoverText.label")}
        required
        tooltipId="publish-work-back-cover-text-tooltip"
        tooltip={getPublishBackCoverTextGuidance(t)}
        error={imprintError(errors, "backCoverText")}
        value={values.backCoverText}
        maxLength={WORK_PUBLISH_BACK_COVER_TEXT_MAX_LENGTH}
        disabled={disabled}
        rows={4}
        onChange={(event) => onFieldChange("backCoverText", event.target.value)}
      />

      <FormTextareaControl
        id="publish-work-about-author"
        name="aboutAuthor"
        label={t("publish.fields.aboutAuthor.label")}
        required
        tooltipId="publish-work-about-author-tooltip"
        tooltip={getPublishAboutAuthorGuidance(t)}
        error={imprintError(errors, "aboutAuthor")}
        value={values.aboutAuthor}
        maxLength={WORK_PUBLISH_ABOUT_AUTHOR_MAX_LENGTH}
        disabled={disabled}
        rows={3}
        onChange={(event) => onFieldChange("aboutAuthor", event.target.value)}
      />

      <div className="space-y-1">
        <FormFieldLabel
          htmlFor="publish-work-author-address"
          labelId={authorLabelId}
          label={t("publish.fields.authorAddress.label")}
          tooltipId="publish-work-author-address-tooltip"
          tooltip={getPublishAuthorAddressGuidance(t)}
        />
        <input
          id="publish-work-author-address"
          name="authorAddress"
          type="text"
          readOnly
          value={authorAddress}
          aria-labelledby={authorLabelId}
          className={`${formTextInputClassName} cursor-default text-white/70`}
        />
      </div>
    </fieldset>
  );
}
