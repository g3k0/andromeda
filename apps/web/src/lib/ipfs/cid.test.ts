import { describe, expect, it } from "vitest";

import { cidFromContent, cidFromJson } from "./cid";

describe("cid helpers", () => {
  it("derives deterministic CIDs from byte content", () => {
    const content = new TextEncoder().encode("encrypted payload");
    expect(cidFromContent(content)).toBe(cidFromContent(content));
    expect(cidFromContent(content)).toMatch(/^bafkbei[0-9a-f]{64}$/);
  });

  it("derives deterministic CIDs from JSON payloads", () => {
    const metadata = { name: "Work #1", ace: { version: "1" } };
    expect(cidFromJson(metadata)).toBe(cidFromJson(metadata));
  });
});
