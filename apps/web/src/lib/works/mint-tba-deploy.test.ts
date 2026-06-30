import { describe, expect, it } from "vitest";

import { createInMemoryTba } from "@/lib/tba/testing/in-memory-tba";
import type { Erc6551RegistryConfig } from "@/lib/tba/tba-registry";

import { buildTokenTbaLookup, planTokenTbaDeployment } from "./mint-tba-deploy";

const CONFIG: Erc6551RegistryConfig = {
  registry: "0x000000006551c19487814612e58FE06813775758",
  implementation: "0x55266d75D1a14E4572138116aF39863Ed6596E7F",
  chainId: 80002,
};

const TOKEN_CONTRACT = "0x1111111111111111111111111111111111111111" as const;

function lookup(tokenId: bigint) {
  return buildTokenTbaLookup({
    chainId: CONFIG.chainId,
    tokenContract: TOKEN_CONTRACT,
    tokenId,
  });
}

describe("buildTokenTbaLookup", () => {
  it("maps token coordinates into TBA lookup params", () => {
    expect(lookup(5n)).toEqual({
      chainId: 80002,
      tokenContract: TOKEN_CONTRACT,
      tokenId: 5n,
    });
  });
});

describe("planTokenTbaDeployment", () => {
  it("plans a deploy transaction when the TBA is not yet deployed", async () => {
    const tba = createInMemoryTba({ config: CONFIG });

    const plan = await planTokenTbaDeployment(tba, lookup(7n));

    expect(plan.alreadyDeployed).toBe(false);
    expect(plan.deployTransaction).not.toBeNull();
    expect(plan.deployTransaction?.to).toBe(CONFIG.registry);
    expect(plan.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("skips deployment when the TBA already exists", async () => {
    const tba = createInMemoryTba({ config: CONFIG });
    const address = await tba.getAddress(lookup(7n));
    const deployedTba = createInMemoryTba({
      config: CONFIG,
      deployed: [address],
    });

    const plan = await planTokenTbaDeployment(deployedTba, lookup(7n));

    expect(plan.alreadyDeployed).toBe(true);
    expect(plan.deployTransaction).toBeNull();
    expect(plan.address).toBe(address);
  });
});
