export type LoadingSpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<LoadingSpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export type LoadingSpinnerProps = {
  size?: LoadingSpinnerSize;
  label?: string;
  className?: string;
};

export function LoadingSpinner({
  size = "md",
  label = "Loading",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <output
      aria-live="polite"
      aria-label={label}
      className={`inline-flex items-center justify-center border-0 bg-transparent p-0 ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className={`animate-spin rounded-full border-white/20 border-t-andromeda-light ${SIZE_CLASSES[size]}`}
      />
    </output>
  );
}
