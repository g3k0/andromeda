import { describe, expect, it } from "vitest";
import { createTranslateFn } from "@/lib/i18n/translate";

import {
  validateWorkPublishExternalUrl,
  validateWorkPublishMaxCopies,
  validateWorkPublishName,
  validateWorkPublishPriceMatic,
} from "./work-publish-field-validation";

const t = createTranslateFn("en");

describe("work publish field validation", () => {
  it("rejects empty and unsafe title values", () => {
    expect(validateWorkPublishName("", t)).toBe("Title is required.");
    expect(validateWorkPublishName("Bad\u0007 title", t)).toBe(
      "Title contains invalid characters.",
    );
    expect(validateWorkPublishName("Valid title", t)).toBeNull();
  });

  it("accepts http(s) external URLs and rejects others", () => {
    expect(validateWorkPublishExternalUrl("", t)).toBeNull();
    expect(validateWorkPublishExternalUrl("https://example.com/book", t)).toBeNull();
    expect(validateWorkPublishExternalUrl("javascript:alert(1)", t)).toBe(
      "External URL must use HTTP or HTTPS.",
    );
    expect(validateWorkPublishExternalUrl("not-a-url", t)).toBe("Enter a valid URL.");
  });

  it("treats an empty initial price as optional", () => {
    expect(validateWorkPublishPriceMatic("", t)).toBeNull();
    expect(validateWorkPublishPriceMatic("   ", t)).toBeNull();
    expect(validateWorkPublishPriceMatic("0.01", t)).toBeNull();
    expect(validateWorkPublishPriceMatic("not-a-price", t)).toBe(
      "Enter a valid MATIC price.",
    );
  });

  it("requires max copies between 1 and 500", () => {
    expect(validateWorkPublishMaxCopies("", t)).toBe("Max copies is required.");
    expect(validateWorkPublishMaxCopies("0", t)).toBe("Max copies must be at least 1.");
    expect(validateWorkPublishMaxCopies("501", t)).toBe("Max copies cannot exceed 500.");
    expect(validateWorkPublishMaxCopies("1.5", t)).toBe("Max copies must be a whole number.");
    expect(validateWorkPublishMaxCopies("1", t)).toBeNull();
    expect(validateWorkPublishMaxCopies("500", t)).toBeNull();
  });
});
