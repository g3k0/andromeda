import { describe, expect, it } from "vitest";
import { WalletAuthExpiredError } from "@/lib/auth/errors";
import { createTranslateFn } from "@/lib/i18n/translate";
import {
  ApiClientError,
  parseApiErrorBody,
  translateApiErrorBody,
  translateApiErrorCode,
  translateClientError,
} from "./api-error-messages";

const t = createTranslateFn("en");

describe("api-error-messages", () => {
  it("translates known API error codes", () => {
    expect(translateApiErrorCode(t, "not_authorized")).toBe("Not authorized.");
    expect(translateApiErrorCode(t, "role_in_use", { slug: "moderator", count: 2 })).toBe(
      "Role moderator is assigned to 2 user(s). Reassign them before deleting.",
    );
  });

  it("parses API error bodies with code and params", () => {
    expect(
      parseApiErrorBody({ code: "rate_limited", error: "Too many requests." }),
    ).toEqual({ code: "rate_limited" });
    expect(parseApiErrorBody({ error: "Missing code" })).toBeNull();
  });

  it("translates API error bodies", () => {
    expect(
      translateApiErrorBody(t, {
        code: "forbidden_content_key",
        error: "Content keys must never be sent to the server.",
      }),
    ).toBe("Content keys must never be sent to the server.");
  });

  it("translates ApiClientError and wallet auth errors", () => {
    expect(
      translateClientError(t, new ApiClientError("wallet_auth_message_failed")),
    ).toBe("Failed to create wallet authentication message.");
    expect(translateClientError(t, new WalletAuthExpiredError())).toBe(
      "Your wallet session expired. Please confirm again in your wallet.",
    );
  });

  it("translates domain errors that expose i18n code fields", () => {
    expect(
      translateClientError(t, {
        code: "publish.validation.manuscriptFile.required",
      }),
    ).toBeTruthy();
  });
});
