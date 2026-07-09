import { describe, expect, it } from "vitest";

import {
  createReaderState,
  isReaderBusy,
  readerReducer,
} from "./reader-state";

describe("reader state", () => {
  it("starts idle", () => {
    expect(createReaderState()).toEqual({
      status: "idle",
      text: null,
      errorMessage: null,
    });
  });

  it("moves through the decrypt happy path", () => {
    let state = createReaderState();
    state = readerReducer(state, { type: "decrypt_started" });
    expect(state.status).toBe("decrypting");
    expect(isReaderBusy(state.status)).toBe(true);

    state = readerReducer(state, {
      type: "decrypt_succeeded",
      text: "Hello",
    });
    expect(state).toEqual({
      status: "reading",
      text: "Hello",
      errorMessage: null,
    });
    expect(isReaderBusy(state.status)).toBe(false);
  });

  it("captures decrypt errors and clears any previous text", () => {
    const state = readerReducer(
      { status: "reading", text: "old", errorMessage: null },
      { type: "decrypt_failed", message: "boom" },
    );
    expect(state).toEqual({
      status: "error",
      text: null,
      errorMessage: "boom",
    });
  });

  it("resets back to idle", () => {
    const state = readerReducer(
      { status: "error", text: null, errorMessage: "boom" },
      { type: "reset" },
    );
    expect(state).toEqual(createReaderState());
  });
});
