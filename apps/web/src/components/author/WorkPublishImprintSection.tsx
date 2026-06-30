import type { WorkPublishImprintFormValues } from "@/lib/works/work-imprint-metadata";
import { WORK_PUBLISH_FORM_GUIDANCE } from "@/lib/works/work-publish-form-guidance";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
} from "@/lib/works/work-publish-form-state";

import { FormFieldLabel } from "@/components/form/FormFieldLabel";
import { FormTextControl } from "@/components/form/FormTextControl";
import {
  formErrorClassName,
  formSelectClassName,
  formTextInputClassName,
} from "@/components/form/form-field-styles";
import { formFieldDescribedBy, resolveFormFieldLabelId } from "@/components/form/form-field-utils";
import {
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
  const authorLabelId = resolveFormFieldLabelId("publish-work-author-address");

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-lg border border-white/10 p-4"
    >
      <legend className="px-1 text-sm font-medium text-white">Work metadata</legend>
      <p className="text-xs leading-relaxed text-white/50">
        Imprint details stored in public metadata, like the colophon page of a printed
        edition.
      </p>

      <FormTextControl
        id="publish-work-publication-date"
        name="publicationDate"
        label="Publication date"
        required
        tooltipId="publish-work-publication-date-tooltip"
        tooltip={WORK_PUBLISH_FORM_GUIDANCE.publicationDate}
        error={imprintError(errors, "publicationDate")}
        type="date"
        value={values.publicationDate}
        onChange={(event) => onFieldChange("publicationDate", event.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextControl
          id="publish-work-edition-number"
          name="editionNumber"
          label="Edition number"
          required
          tooltipId="publish-work-edition-number-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.editionNumber}
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
            label="Edition kind"
            required
            tooltipId="publish-work-edition-kind-tooltip"
            tooltip={WORK_PUBLISH_FORM_GUIDANCE.editionKind}
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
            <option value="first">First edition</option>
            <option value="reprint">Reprint</option>
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
          label="Reprint number"
          required
          tooltipId="publish-work-reprint-number-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.reprintNumber}
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
          label="Series name"
          tooltipId="publish-work-series-name-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.seriesName}
          error={imprintError(errors, "seriesName")}
          type="text"
          maxLength={WORK_PUBLISH_SERIES_NAME_MAX_LENGTH}
          value={values.seriesName}
          onChange={(event) => onFieldChange("seriesName", event.target.value)}
        />

        <FormTextControl
          id="publish-work-series-volume"
          name="seriesVolume"
          label="Series volume"
          tooltipId="publish-work-series-volume-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.seriesVolume}
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
          label="Language"
          tooltipId="publish-work-language-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.language}
          error={imprintError(errors, "language")}
          type="text"
          maxLength={WORK_PUBLISH_LANGUAGE_MAX_LENGTH}
          placeholder="e.g. en, it"
          value={values.language}
          onChange={(event) => onFieldChange("language", event.target.value)}
        />

        <FormTextControl
          id="publish-work-original-publication-date"
          name="originalPublicationDate"
          label="Original publication date"
          tooltipId="publish-work-original-publication-date-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.originalPublicationDate}
          error={imprintError(errors, "originalPublicationDate")}
          type="date"
          value={values.originalPublicationDate}
          onChange={(event) =>
            onFieldChange("originalPublicationDate", event.target.value)
          }
        />
      </div>

      <div className="space-y-1">
        <FormFieldLabel
          htmlFor="publish-work-author-address"
          labelId={authorLabelId}
          label="Author public address"
          tooltipId="publish-work-author-address-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.authorAddress}
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
