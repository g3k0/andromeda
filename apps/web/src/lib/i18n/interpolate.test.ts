import { describe, expect, it } from "vitest";

import { interpolate } from "./interpolate";

describe("interpolate", () => {
  it("replaces named placeholders", () => {
    expect(interpolate("Copy #{number} / {total}", { number: 3, total: 10 })).toBe(
      "Copy #3 / 10",
    );
  });

  it("leaves unknown placeholders unchanged", () => {
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}");
  });

  it("returns the template when params are omitted", () => {
    expect(interpolate("Plain text")).toBe("Plain text");
  });
});
