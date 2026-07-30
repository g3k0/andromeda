import { describe, expect, it, vi, afterEach } from "vitest";

import {
  averageWincCost,
  buildPermanentUploadMetricContext,
  recordPermanentUploadMetric,
} from "./permanent-upload-metrics";

describe("permanent-upload-metrics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds metric context with optional winc and errorName", () => {
    expect(
      buildPermanentUploadMetricContext({
        backend: "arweave",
        outcome: "success",
        sizeBytes: 128,
        durationMs: 42,
        winc: "1000",
      }),
    ).toEqual({
      backend: "arweave",
      outcome: "success",
      sizeBytes: 128,
      durationMs: 42,
      winc: "1000",
    });
  });

  it("logs success and error upload metrics", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    recordPermanentUploadMetric({
      backend: "arweave",
      outcome: "success",
      sizeBytes: 10,
      durationMs: 5,
      winc: "250",
    });
    recordPermanentUploadMetric({
      backend: "arweave",
      outcome: "error",
      sizeBytes: 10,
      durationMs: 7,
      errorName: "Error",
    });

    expect(info).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(info.mock.calls[0]?.[0])).toContain("turbo_upload_ok");
    expect(String(error.mock.calls[0]?.[0])).toContain("turbo_upload_error");
  });

  it("averages finite winc values", () => {
    expect(averageWincCost(["100", "300", "bad"])).toBe(200);
    expect(averageWincCost([])).toBeNull();
  });
});
