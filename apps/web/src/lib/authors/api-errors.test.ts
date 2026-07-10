import { describe, expect, it } from "vitest";
import { RateLimitExceededError } from "@/lib/auth/errors";
import { RoleInUseError } from "@/lib/roles/errors";
import { buildApiErrorBody } from "@/lib/api/error-response";
import { AuthorProfileNotFoundError } from "./errors";
import {
  mapAuthorErrorToCode,
  mapAuthorErrorToMessage,
  mapAuthorErrorToStatus,
} from "./api-errors";

describe("api-errors", () => {
  it("maps rate limit errors to 429", () => {
    expect(mapAuthorErrorToStatus(new RateLimitExceededError())).toBe(429);
    expect(mapAuthorErrorToMessage(new RateLimitExceededError())).toBe(
      "Too many requests.",
    );
    expect(mapAuthorErrorToCode(new RateLimitExceededError())).toBe("rate_limited");
  });

  it("maps missing profiles to 404", () => {
    expect(
      mapAuthorErrorToStatus(new AuthorProfileNotFoundError("0xabc")),
    ).toBe(404);
    expect(mapAuthorErrorToCode(new AuthorProfileNotFoundError("0xabc"))).toBe(
      "author_profile_not_found",
    );
  });

  it("builds API error bodies with code", () => {
    const body = buildApiErrorBody(
      new RoleInUseError("moderator", 1),
      () => 409,
      (error) => (error as RoleInUseError).message,
      () => "role_in_use",
      (error) => ({
        slug: (error as RoleInUseError).slug,
        count: (error as RoleInUseError).userCount,
      }),
    );

    expect(body.code).toBe("role_in_use");
    expect(body.params).toEqual({ slug: "moderator", count: 1 });
  });
});
