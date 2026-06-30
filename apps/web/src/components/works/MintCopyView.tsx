import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { formErrorClassName } from "@/components/form/form-field-styles";
import {
  isMintCopyBusy,
  type MintCopyStep,
} from "@/lib/works/mint-copy-client-state";
import type { WorkAvailability } from "@/lib/works/mint-copy-tx";

export type MintCopyViewProps = {
  title: string;
  priceLabel: string;
  availability: WorkAvailability;
  step: MintCopyStep;
  tokenId: bigint | null;
  txHash: `0x${string}` | null;
  tbaAddress: `0x${string}` | null;
  errorMessage: string | null;
  /** True when the connected wallet can submit the purchase. */
  canMint: boolean;
  onMint: () => void;
};

const STEP_LABELS: Record<MintCopyStep, string> = {
  idle: "Buy a copy",
  minting: "Confirm in wallet…",
  deploying_tba: "Setting up token account…",
  pinning_envelope: "Preparing your reading key…",
  success: "Copy minted",
  error: "Buy a copy",
};

function availabilityLabel(availability: WorkAvailability): string {
  if (availability.remaining === null) {
    return "Open edition";
  }
  if (availability.soldOut) {
    return "Sold out";
  }
  return `${availability.remaining.toString()} copies left`;
}

export function MintCopyView({
  title,
  priceLabel,
  availability,
  step,
  tokenId,
  txHash,
  tbaAddress,
  errorMessage,
  canMint,
  onMint,
}: MintCopyViewProps) {
  const busy = isMintCopyBusy(step);
  const disabled = !canMint || busy || !availability.saleOpen || step === "success";

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/70">
          {priceLabel} · {availabilityLabel(availability)}
        </p>
      </header>

      <button
        type="button"
        disabled={disabled}
        onClick={onMint}
        className="inline-flex items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? <LoadingSpinner size="sm" /> : null}
        {availability.soldOut ? "Sold out" : STEP_LABELS[step]}
      </button>

      {step === "success" ? (
        <div className="space-y-1 text-sm text-emerald-400">
          <p>Copy #{tokenId?.toString()} minted successfully.</p>
          {tbaAddress ? (
            <p className="break-all text-xs text-white/60">
              Token account: {tbaAddress}
            </p>
          ) : null}
          {txHash ? (
            <p className="break-all text-xs text-white/60">
              Transaction: {txHash}
            </p>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p className={formErrorClassName} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
