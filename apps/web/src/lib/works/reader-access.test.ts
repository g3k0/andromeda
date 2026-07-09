import { describe, expect, it } from "vitest";

import { createInMemoryChainReader } from "@/lib/chain/testing/in-memory-chain-reader";

import { isCopyOwner, resolveCopyAccess } from "./reader-access";

const OWNER = "0x2222222222222222222222222222222222222222";
const OTHER = "0x3333333333333333333333333333333333333333";

describe("isCopyOwner", () => {
  it("matches owner regardless of casing", () => {
    expect(isCopyOwner(OWNER, OWNER.toUpperCase().replace("0X", "0x"))).toBe(
      true,
    );
  });

  it("returns false for a different or missing address", () => {
    expect(isCopyOwner(OWNER, OTHER)).toBe(false);
    expect(isCopyOwner(OWNER, null)).toBe(false);
    expect(isCopyOwner(OWNER, "not-an-address")).toBe(false);
  });
});

describe("resolveCopyAccess", () => {
  const reader = createInMemoryChainReader({
    tokens: [{ tokenId: 10n, owner: OWNER, workId: 1n }],
  });

  it("grants access to the on-chain owner", async () => {
    const access = await resolveCopyAccess(reader, 10n, OWNER);
    expect(access).toMatchObject({ exists: true, isOwner: true, owner: OWNER });
  });

  it("denies access to a non-owner", async () => {
    const access = await resolveCopyAccess(reader, 10n, OTHER);
    expect(access.exists).toBe(true);
    expect(access.isOwner).toBe(false);
  });

  it("reports a non-existent token", async () => {
    const access = await resolveCopyAccess(reader, 99n, OWNER);
    expect(access).toEqual({
      tokenId: 99n,
      owner: null,
      exists: false,
      isOwner: false,
    });
  });
});
