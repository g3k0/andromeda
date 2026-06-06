import { LoadingSpinner } from "./LoadingSpinner";

export type LoadingPanelProps = {
  label?: string;
  className?: string;
};

export function LoadingPanel({
  label = "Loading…",
  className = "",
}: LoadingPanelProps) {
  return (
    <div
      className={`flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-8 text-center ${className}`.trim()}
    >
      <LoadingSpinner size="lg" label={label} />
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}
