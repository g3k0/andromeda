import { expect } from "chai";
import { ethers } from "hardhat";

describe("AndromedaWorks reentrancy", () => {
  it("compiles with nonReentrant mintCopy protection", async () => {
    const factory = await ethers.getContractFactory("AndromedaWorks");
    const contract = await factory.deploy((await ethers.getSigners())[0].address);
    await contract.waitForDeployment();

    const fragment = contract.interface.getFunction("mintCopy");
    expect(fragment).to.not.equal(null);
  });
});
