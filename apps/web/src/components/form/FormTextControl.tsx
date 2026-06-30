import type { InputHTMLAttributes } from "react";

import { FormFieldLabel } from "./FormFieldLabel";
import { formErrorClassName, formTextInputClassName } from "./form-field-styles";
import { formFieldDescribedBy, resolveFormFieldLabelId } from "./form-field-utils";

export type FormTextControlProps = {
  id: string;
  label: string;
  required?: boolean;
  tooltipId: string;
  tooltip: string;
  error?: string;
  hintId?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function FormTextControl({
  id,
  label,
  required = false,
  tooltipId,
  tooltip,
  error,
  hintId,
  className,
  "aria-describedby": ariaDescribedBy,
  ...inputProps
}: FormTextControlProps) {
  const labelId = resolveFormFieldLabelId(id);
  const errorId = `${id}-error`;
  const describedBy =
    ariaDescribedBy ??
    formFieldDescribedBy(error, errorId, hintId);

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
        aria-labelledby={labelId}
        aria-required={required ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={className ?? formTextInputClassName}
      />
      {error ? (
        <p id={errorId} className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
