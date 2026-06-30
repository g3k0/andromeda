import type { InputHTMLAttributes } from "react";

import { FormFieldLabel } from "./FormFieldLabel";
import { formErrorClassName, formFileInputClassName } from "./form-field-styles";
import { formFieldDescribedBy, resolveFormFieldLabelId } from "./form-field-utils";

export type FormFileControlProps = {
  id: string;
  label: string;
  required?: boolean;
  tooltipId: string;
  tooltip: string;
  error?: string;
  selectedFileName?: string | null;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type">;

export function FormFileControl({
  id,
  label,
  required = false,
  tooltipId,
  tooltip,
  error,
  selectedFileName,
  className,
  ...inputProps
}: FormFileControlProps) {
  const labelId = resolveFormFieldLabelId(id);
  const errorId = `${id}-error`;
  const selectionHintId = selectedFileName ? `${id}-selected` : undefined;

  return (
    <div className="space-y-1">
      <FormFieldLabel
        htmlFor={id}
        labelId={labelId}
        label={label}
        required={required}
        tooltipId={tooltipId}
        tooltip={tooltip}
      />
      <input
        {...inputProps}
        id={id}
        type="file"
        aria-labelledby={labelId}
        aria-required={required ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={formFieldDescribedBy(error, errorId, selectionHintId)}
        className={className ?? formFileInputClassName}
      />
      {selectedFileName ? (
        <p id={selectionHintId} className="text-xs text-white/50">
          Selected: {selectedFileName}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
