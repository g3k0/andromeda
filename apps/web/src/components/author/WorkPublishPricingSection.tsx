"use client";

import { FormTextControl } from "@/components/form/FormTextControl";
import {
  getPublishInitialPriceGuidance,
  getPublishMaxCopiesGuidance,
} from "@/lib/i18n/publish-messages";
import { useTranslation } from "@/lib/i18n/use-translation";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
} from "@/lib/works/work-publish-form-state";
import {
  WORK_PUBLISH_MAX_MAX_COPIES,
  WORK_PUBLISH_MIN_MAX_COPIES,
} from "@/lib/works/work-publish-limits";

export type WorkPublishPricingSectionProps = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
  disabled: boolean;
  onFieldChange: (field: keyof WorkPublishFormValues, value: string) => void;
};

export function WorkPublishPricingSection({
  values,
  errors,
  disabled,
  onFieldChange,
}: WorkPublishPricingSectionProps) {
  const { t } = useTranslation();

  return (
    <fieldset
      disabled={disabled}
      className="space-y-4 rounded-lg border border-white/10 p-4"
    >
      <legend className="px-1 text-sm font-medium text-white">
        {t("publish.sections.pricing.legend")}
      </legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextControl
          id="publish-work-price"
          name="priceMatic"
          label={t("publish.fields.priceMatic.label")}
          tooltipId="publish-work-price-tooltip"
          tooltip={getPublishInitialPriceGuidance(t)}
          error={errors.priceMatic}
          type="text"
          inputMode="decimal"
          value={values.priceMatic}
          placeholder={t("publish.fields.priceMatic.placeholder")}
          onChange={(event) => onFieldChange("priceMatic", event.target.value)}
        />

        <FormTextControl
          id="publish-work-max-copies"
          name="maxCopies"
          label={t("publish.fields.maxCopies.label")}
          required
          tooltipId="publish-work-max-copies-tooltip"
          tooltip={getPublishMaxCopiesGuidance(t)}
          error={errors.maxCopies}
          type="number"
          min={WORK_PUBLISH_MIN_MAX_COPIES}
          max={WORK_PUBLISH_MAX_MAX_COPIES}
          step={1}
          value={values.maxCopies}
          onChange={(event) => onFieldChange("maxCopies", event.target.value)}
        />
      </div>
    </fieldset>
  );
}
