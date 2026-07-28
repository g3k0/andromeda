import type { Address } from "viem";

export type MintCopyStep =
  | "idle"
  | "minting"
  | "deploying_tba"
  | "pinning_envelope"
  | "writing_envelope_uri"
  | "success"
  | "error";

export type MintCopyClientState = {
  step: MintCopyStep;
  txHash: `0x${string}` | null;
  tokenId: bigint | null;
  tbaAddress: Address | null;
  envelopeCid: string | null;
  errorMessage: string | null;
};

export type MintCopyClientAction =
  | { type: "mint_started" }
  | { type: "mint_submitted"; txHash: `0x${string}` }
  | { type: "mint_confirmed"; txHash: `0x${string}`; tokenId: bigint }
  | { type: "tba_deploying"; address: Address }
  | { type: "envelope_pinning" }
  | { type: "envelope_uri_writing"; envelopeCid: string }
  | { type: "mint_completed"; envelopeCid?: string | null }
  | { type: "mint_failed"; message: string }
  | { type: "reset" };

export function createMintCopyClientState(): MintCopyClientState {
  return {
    step: "idle",
    txHash: null,
    tokenId: null,
    tbaAddress: null,
    envelopeCid: null,
    errorMessage: null,
  };
}

const BUSY_STEPS: ReadonlySet<MintCopyStep> = new Set([
  "minting",
  "deploying_tba",
  "pinning_envelope",
  "writing_envelope_uri",
]);

export function isMintCopyBusy(step: MintCopyStep): boolean {
  return BUSY_STEPS.has(step);
}

export function mintCopyClientReducer(
  state: MintCopyClientState,
  action: MintCopyClientAction,
): MintCopyClientState {
  switch (action.type) {
    case "mint_started":
      return {
        ...createMintCopyClientState(),
        step: "minting",
      };
    case "mint_submitted":
      return {
        ...state,
        txHash: action.txHash,
      };
    case "mint_confirmed":
      return {
        ...state,
        step: "deploying_tba",
        txHash: action.txHash,
        tokenId: action.tokenId,
        errorMessage: null,
      };
    case "tba_deploying":
      return {
        ...state,
        step: "deploying_tba",
        tbaAddress: action.address,
      };
    case "envelope_pinning":
      return {
        ...state,
        step: "pinning_envelope",
      };
    case "envelope_uri_writing":
      return {
        ...state,
        step: "writing_envelope_uri",
        envelopeCid: action.envelopeCid,
      };
    case "mint_completed":
      return {
        ...state,
        step: "success",
        envelopeCid: action.envelopeCid ?? state.envelopeCid,
        errorMessage: null,
      };
    case "mint_failed":
      return {
        ...state,
        step: "error",
        errorMessage: action.message,
      };
    case "reset":
      return createMintCopyClientState();
    default:
      return state;
  }
}
