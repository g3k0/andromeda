import { describe, expect, it } from "vitest";
import {
  decrementLoadingCount,
  incrementLoadingCount,
  isLoadingActive,
} from "./loading-state";

describe("loading-state", () => {
  it("tracks active loading with a counter", () => {
    expect(isLoadingActive(0)).toBe(false);

    const started = incrementLoadingCount(0);
    expect(isLoadingActive(started)).toBe(true);

    const nested = incrementLoadingCount(started);
    const afterOne = decrementLoadingCount(nested);
    expect(isLoadingActive(afterOne)).toBe(true);

    const cleared = decrementLoadingCount(afterOne);
    expect(isLoadingActive(cleared)).toBe(false);
  });

  it("never drops below zero", () => {
    expect(decrementLoadingCount(0)).toBe(0);
  });
});
