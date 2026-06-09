import { describe, expect, it } from "vitest";
import { userMetadataSchema } from "./user-metadata-schema";

describe("userMetadataSchema", () => {
  it("accepts small metadata objects", () => {
    expect(
      userMetadataSchema.parse({
        source: "migration",
        beta: true,
      }),
    ).toEqual({
      source: "migration",
      beta: true,
    });
  });

  it("rejects deeply nested metadata", () => {
    expect(() =>
      userMetadataSchema.parse({
        level1: { level2: { level3: { level4: "too deep" } } },
      }),
    ).toThrow();
  });

  it("rejects oversized metadata payloads", () => {
    expect(() =>
      userMetadataSchema.parse({
        payload: "x".repeat(5_000),
      }),
    ).toThrow();
  });
});
