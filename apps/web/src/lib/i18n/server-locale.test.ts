import { describe, expect, it, vi } from "vitest";

import { LOCALE_COOKIE } from "./cookie";
import { getRequestLocale } from "./server-locale";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";

const mockedCookies = vi.mocked(cookies);

describe("getRequestLocale", () => {
  it("returns the locale from the synced cookie", async () => {
    mockedCookies.mockResolvedValue({
      get: (name: string) =>
        name === LOCALE_COOKIE ? { value: "it" } : undefined,
    } as Awaited<ReturnType<typeof cookies>>);

    await expect(getRequestLocale()).resolves.toBe("it");
  });

  it("falls back to English when the cookie is missing", async () => {
    mockedCookies.mockResolvedValue({
      get: () => undefined,
    } as Awaited<ReturnType<typeof cookies>>);

    await expect(getRequestLocale()).resolves.toBe("en");
  });
});
