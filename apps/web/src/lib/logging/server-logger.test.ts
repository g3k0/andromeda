import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildLogEntry,
  logServerError,
  logServerInfo,
  logServerWarn,
  redactSensitive,
} from "./server-logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("redactSensitive", () => {
  it("redacts bearer tokens", () => {
    expect(redactSensitive("Authorization: Bearer sk_live_abc123")).toBe(
      "Authorization: Bearer [redacted]",
    );
  });

  it("redacts alchemy rpc url path keys", () => {
    expect(
      redactSensitive("https://polygon-amoy.g.alchemy.com/v2/AbC123secretKey456"),
    ).toBe("https://polygon-amoy.g.alchemy.com/v2/[redacted]");
  });

  it("redacts key/token/secret assignments", () => {
    expect(redactSensitive('{"api_key":"xyz987","other":"ok"}')).toContain(
      '"api_key":"[redacted]"',
    );
    expect(redactSensitive("signing_key=whsec_deadbeef")).toBe(
      "signing_key=[redacted]",
    );
    expect(redactSensitive("token: mytoken123")).toBe("token: [redacted]");
  });

  it("leaves non-sensitive text untouched", () => {
    expect(redactSensitive("Unable to pin content to IPFS")).toBe(
      "Unable to pin content to IPFS",
    );
  });
});

describe("buildLogEntry", () => {
  it("sanitizes the error message and drops the stack", () => {
    const error = new Error("failed with Bearer sk_secret_tok");
    const entry = buildLogEntry("error", "ipfs.pinata", "pin_failed", error, {
      status: 500,
    });

    expect(entry.level).toBe("error");
    expect(entry.scope).toBe("ipfs.pinata");
    expect(entry.event).toBe("pin_failed");
    expect(entry.status).toBe(500);
    expect(entry.error).toEqual({
      name: "Error",
      message: "failed with Bearer [redacted]",
    });
    expect(entry).not.toHaveProperty("stack");
    expect(typeof entry.at).toBe("string");
  });

  it("redacts sensitive string context values and omits undefined", () => {
    const entry = buildLogEntry("warn", "chain.rpc", "getLogs_failed", undefined, {
      url: "https://polygon.g.alchemy.com/v2/topsecretkeyvalue",
      skipped: undefined,
    });

    expect(entry.url).toBe("https://polygon.g.alchemy.com/v2/[redacted]");
    expect(entry).not.toHaveProperty("skipped");
    expect(entry).not.toHaveProperty("error");
  });

  it("handles non-Error thrown values", () => {
    expect(buildLogEntry("error", "s", "e", "boom").error).toEqual({
      name: "Error",
      message: "boom",
    });
    expect(buildLogEntry("error", "s", "e", { weird: true }).error).toEqual({
      name: "UnknownError",
      message: "Non-error value thrown",
    });
  });
});

describe("logServerError / logServerWarn / logServerInfo", () => {
  it("writes a single JSON line to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logServerError("chain.webhook", "process_failed", new Error("nope"), {
      webhookId: "wh_1",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed).toMatchObject({
      level: "error",
      scope: "chain.webhook",
      event: "process_failed",
      webhookId: "wh_1",
      error: { name: "Error", message: "nope" },
    });
  });

  it("writes a single JSON line to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logServerWarn("chain.indexer", "range_skipped", { fromBlock: 10 });

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed).toMatchObject({
      level: "warn",
      scope: "chain.indexer",
      event: "range_skipped",
      fromBlock: 10,
    });
  });

  it("writes a single JSON line to console.info", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logServerInfo("ipfs.arweave", "turbo_upload_ok", { sizeBytes: 12 });

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed).toMatchObject({
      level: "info",
      scope: "ipfs.arweave",
      event: "turbo_upload_ok",
      sizeBytes: 12,
    });
  });
});
