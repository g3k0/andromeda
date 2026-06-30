import type { ReactNode } from "react";

import { FormFieldTooltip } from "./FormFieldTooltip";

export type FormFieldLabelProps = {
  htmlFor: string;
  label: string;
  required?: boolean;
  tooltipId: string;
  tooltip: string;
  children?: ReactNode;
};

export function FormFieldLabel({
  htmlFor,
  label,
  required = false,
  tooltipId,
  tooltip,
  children,
}: FormFieldLabelProps) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-white/60">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-0.5 text-red-400">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      <FormFieldTooltip id={tooltipId} content={tooltip} />
      {children}
    </div>
  );
}
