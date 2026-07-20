import { afterEach, describe, expect, it } from "vitest";

import { resetServerEnvForTests } from "@/lib/config/env";

import { resolveWorkPublishChainConfig } from "./work-publish-chain-config";
import { WorkUploadValidationError } from "./errors";

describe("resolveWorkPublishChainConfig", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    resetServerEnvForTests();
  });

  it("returns chain config when the contract address is configured", () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS =
      "0x3333333333333333333333333333333333333333";

    expect(resolveWorkPublishChainConfig()).toEqual({
      contractAddress: "0x3333333333333333333333333333333333333333",
      registryAddress: "0x000000006551c19487814612e58FE06813775758",
      chainId: expect.any(Number),
    });
  });

  it("rejects a missing contract address before metadata validation", () => {
    expect(() => resolveWorkPublishChainConfig()).toThrow(WorkUploadValidationError);
  });
});
