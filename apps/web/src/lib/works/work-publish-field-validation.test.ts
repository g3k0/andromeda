import { describe, expect, it } from "vitest";

import {
  validateWorkPublishDescription,
  validateWorkPublishExternalUrl,
  validateWorkPublishName,
  validateWorkPublishPriceMatic,
} from "./work-publish-field-validation";

describe("work publish field validation", () => {
  it("rejects empty and unsafe title values", () => {
    expect(validateWorkPublishName("")).toBe("Title is required.");
    expect(validateWorkPublishName("Bad\u0007 title")).toBe(
      "Title contains invalid characters.",
    );
    expect(validateWorkPublishName("Valid title")).toBeNull();
  });

  it("rejects empty and oversized descriptions", () => {
    expect(validateWorkPublishDescription("")).toBe("Description is required.");
    expect(validateWorkPublishDescription("a".repeat(501))).toContain("500");
    expect(validateWorkPublishDescription("A valid description.")).toBeNull();
  });

  it("accepts http(s) external URLs and rejects others", () => {
    expect(validateWorkPublishExternalUrl("")).toBeNull();
    expect(validateWorkPublishExternalUrl("https://example.com/book")).toBeNull();
    expect(validateWorkPublishExternalUrl("javascript:alert(1)")).toBe(
      "External URL must use HTTP or HTTPS.",
    );
    expect(validateWorkPublishExternalUrl("not-a-url")).toBe("Enter a valid URL.");
  });

  it("treats an empty initial price as optional", () => {
    expect(validateWorkPublishPriceMatic("")).toBeNull();
    expect(validateWorkPublishPriceMatic("   ")).toBeNull();
    expect(validateWorkPublishPriceMatic("0.01")).toBeNull();
    expect(validateWorkPublishPriceMatic("not-a-price")).toBe(
      "Enter a valid MATIC price.",
    );
  });
});
