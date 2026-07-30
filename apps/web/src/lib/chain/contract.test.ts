import { afterEach, describe, expect, it } from "vitest";

import { andromedaWorksAbi, getContractAddress } from "./contract";

function getFunctionNames(abi: typeof andromedaWorksAbi): string[] {
  return abi
    .filter((item) => item.type === "function")
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
}

describe("chain contract", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("loads the full AndromedaWorks ABI with read helpers", () => {
    const names = getFunctionNames(andromedaWorksAbi);

    expect(names).toEqual(
      expect.arrayContaining([
        "totalWorks",
        "works",
        "workOfToken",
        "ownerOf",
        "primarySaleRemaining",
        "mintCopy",
        "registerWork",
        "updateWorkMetadataURI",
        "setCopyEnvelopeURI",
      ]),
    );
    expect(andromedaWorksAbi.length).toBeGreaterThan(10);
  });

  it("reads contract address from public env", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS =
      "0xabcdef0123456789abcdef0123456789abcdef01";

    expect(getContractAddress()).toBe(
      "0xabcdef0123456789abcdef0123456789abcdef01",
    );
  });
});
