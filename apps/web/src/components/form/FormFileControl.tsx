import type { InputHTMLAttributes, ReactNode } from "react";

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
  selectionHint?: ReactNode;
  selectionHintId?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type">;

export function FormFileControl({
  id,
  label,
  required = false,
  tooltipId,
  tooltip,
  error,
  selectionHint,
  selectionHintId,
  className,
  ...inputProps
}: FormFileControlProps) {
  const labelId = resolveFormFieldLabelId(id);
  const errorId = `${id}-error`;

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
      {selectionHint}
      {error ? (
        <p id={errorId} className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
