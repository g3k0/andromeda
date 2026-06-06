import { LoadingSpinner } from "./LoadingSpinner";

export type LoadingOverlayProps = {
  label?: string;
};

export function LoadingOverlay({ label = "Processing…" }: LoadingOverlayProps) {
  return (
    <div
      aria-busy="true"
      aria-live="assertive"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-6"
    >
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#0b0710]/95 px-8 py-6 shadow-xl">
        <LoadingSpinner size="lg" label={label} />
        <p className="text-sm text-white/70">{label}</p>
      </div>
    </div>
  );
}
