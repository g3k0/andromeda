import { describe, expect, it } from "vitest";

import {
  createMintCopyClientState,
  isMintCopyBusy,
  mintCopyClientReducer,
} from "./mint-copy-client-state";

const TBA = "0x000000000000000000000000000000000000dEaD" as const;
const TX = "0x0000000000000000000000000000000000000000000000000000000000000abc" as const;

describe("isMintCopyBusy", () => {
  it("reports the in-flight steps as busy", () => {
    expect(isMintCopyBusy("minting")).toBe(true);
    expect(isMintCopyBusy("deploying_tba")).toBe(true);
    expect(isMintCopyBusy("pinning_envelope")).toBe(true);
    expect(isMintCopyBusy("idle")).toBe(false);
    expect(isMintCopyBusy("success")).toBe(false);
    expect(isMintCopyBusy("error")).toBe(false);
  });
});

describe("mintCopyClientReducer", () => {
  it("walks the happy path from mint to envelope completion", () => {
    let state = mintCopyClientReducer(createMintCopyClientState(), {
      type: "mint_started",
    });
    expect(state.step).toBe("minting");

    state = mintCopyClientReducer(state, {
      type: "mint_submitted",
      txHash: TX,
    });
    expect(state.step).toBe("minting");
    expect(state.txHash).toBe(TX);

    state = mintCopyClientReducer(state, {
      type: "mint_confirmed",
      txHash: TX,
      tokenId: 42n,
    });
    expect(state.step).toBe("deploying_tba");
    expect(state.tokenId).toBe(42n);
    expect(state.txHash).toBe(TX);

    state = mintCopyClientReducer(state, {
      type: "tba_deploying",
      address: TBA,
    });
    expect(state.tbaAddress).toBe(TBA);

    state = mintCopyClientReducer(state, { type: "envelope_pinning" });
    expect(state.step).toBe("pinning_envelope");

    state = mintCopyClientReducer(state, {
      type: "mint_completed",
      envelopeCid: "bafyEnvelope",
    });
    expect(state.step).toBe("success");
    expect(state.envelopeCid).toBe("bafyEnvelope");
    expect(state.errorMessage).toBeNull();
  });

  it("records a failure message and resets cleanly", () => {
    const failed = mintCopyClientReducer(
      { ...createMintCopyClientState(), step: "minting" },
      { type: "mint_failed", message: "User rejected" },
    );
    expect(failed.step).toBe("error");
    expect(failed.errorMessage).toBe("User rejected");

    expect(mintCopyClientReducer(failed, { type: "reset" })).toEqual(
      createMintCopyClientState(),
    );
  });

  it("clears stale state when a new mint starts", () => {
    const dirty = {
      ...createMintCopyClientState(),
      step: "error" as const,
      errorMessage: "old",
      tokenId: 1n,
    };

    expect(mintCopyClientReducer(dirty, { type: "mint_started" })).toEqual({
      ...createMintCopyClientState(),
      step: "minting",
    });
  });
});
