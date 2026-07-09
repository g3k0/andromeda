import { describe, expect, it } from "vitest";

import { InvalidWorkIdParamError } from "./errors";
import {
  parseWorkIdParam,
  toPublicTokenDto,
  toPublicWorkDto,
} from "./public-dto";
import type { TokenRecord, WorkRecord } from "./types";

function workRecord(overrides: Partial<WorkRecord> = {}): WorkRecord {
  return {
    workId: 1n,
    author: "0x1111111111111111111111111111111111111111",
    metadataURI: "ipfs://meta",
    encryptedContentCid: null,
    price: 1000n,
    maxCopies: 10n,
    minted: 3n,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("toPublicWorkDto", () => {
  it("serializes bigint fields and computes remaining copies", () => {
    const dto = toPublicWorkDto(workRecord());
    expect(dto.workId).toBe("1");
    expect(dto.price).toBe("1000");
    expect(dto.remainingCopies).toBe("7");
    expect(dto.soldOut).toBe(false);
  });

  it("marks sold-out editions", () => {
    const dto = toPublicWorkDto(workRecord({ minted: 10n }));
    expect(dto.remainingCopies).toBe("0");
    expect(dto.soldOut).toBe(true);
  });

  it("treats maxCopies 0 as an unlimited edition", () => {
    const dto = toPublicWorkDto(workRecord({ maxCopies: 0n, minted: 5n }));
    expect(dto.remainingCopies).toBeNull();
    expect(dto.soldOut).toBe(false);
  });

  it("never leaks non-public fields", () => {
    const dto = toPublicWorkDto(workRecord());
    expect(Object.keys(dto)).not.toContain("encryptedContentCid");
  });
});

describe("toPublicTokenDto", () => {
  it("serializes token identity and copy metadata", () => {
    const token: TokenRecord = {
      tokenId: 42n,
      workId: 1n,
      owner: "0x2222222222222222222222222222222222222222",
      copyNumber: 2,
      tbaAddress: null,
      envelopeCid: "bafyenvelope",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(toPublicTokenDto(token)).toEqual({
      tokenId: "42",
      workId: "1",
      owner: "0x2222222222222222222222222222222222222222",
      copyNumber: 2,
      tbaAddress: null,
      envelopeCid: "bafyenvelope",
    });
  });
});

describe("parseWorkIdParam", () => {
  it("parses positive integer strings", () => {
    expect(parseWorkIdParam("7")).toBe(7n);
  });

  it("rejects non-numeric or non-positive values", () => {
    expect(() => parseWorkIdParam("abc")).toThrow(InvalidWorkIdParamError);
    expect(() => parseWorkIdParam("0")).toThrow(InvalidWorkIdParamError);
    expect(() => parseWorkIdParam("-1")).toThrow(InvalidWorkIdParamError);
    expect(() => parseWorkIdParam("1.5")).toThrow(InvalidWorkIdParamError);
  });
});
