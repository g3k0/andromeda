import { describe, expect, it } from "vitest";
import { buildRateLimitKey } from "./rate-limit-key";

describe("buildRateLimitKey", () => {
  it("scopes the key when a scope is provided", () => {
    expect(buildRateLimitKey("203.0.113.1", "create-author:0xabc")).toBe(
      "203.0.113.1:create-author:0xabc",
    );
  });

  it("returns the ip when scope is omitted", () => {
    expect(buildRateLimitKey("203.0.113.1")).toBe("203.0.113.1");
  });
});
