import { describe, expect, it } from "vitest";
import { RateLimitExceededError } from "@/lib/auth/errors";
import { AuthorProfileNotFoundError } from "./errors";
import { mapAuthorErrorToMessage, mapAuthorErrorToStatus } from "./api-errors";

describe("api-errors", () => {
  it("maps rate limit errors to 429", () => {
    expect(mapAuthorErrorToStatus(new RateLimitExceededError())).toBe(429);
    expect(mapAuthorErrorToMessage(new RateLimitExceededError())).toBe(
      "Too many requests.",
    );
  });

  it("maps missing profiles to 404", () => {
    expect(
      mapAuthorErrorToStatus(new AuthorProfileNotFoundError("0xabc")),
    ).toBe(404);
  });
});
