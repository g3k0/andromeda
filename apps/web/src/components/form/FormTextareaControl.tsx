import type { TextareaHTMLAttributes } from "react";

import { FormFieldLabel } from "./FormFieldLabel";
import { formErrorClassName, formTextInputClassName } from "./form-field-styles";
import { formFieldDescribedBy, resolveFormFieldLabelId } from "./form-field-utils";

export type FormTextareaControlProps = {
  id: string;
  label: string;
  required?: boolean;
  tooltipId: string;
  tooltip: string;
  error?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function FormTextareaControl({
  id,
  label,
  required = false,
  tooltipId,
  tooltip,
  error,
  className,
  ...textareaProps
}: FormTextareaControlProps) {
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
      <textarea
        {...textareaProps}
        id={id}
        aria-labelledby={labelId}
        aria-required={required ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={formFieldDescribedBy(error, errorId)}
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
