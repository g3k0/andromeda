import { expect } from "chai";
import { ethers } from "hardhat";

describe("AndromedaWorks", () => {
  async function deploy() {
    const [owner, author, reader] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("AndromedaWorks");
    const contract = await factory.deploy(owner.address);
    await contract.waitForDeployment();
    return { contract, owner, author, reader };
  }

  it("registers a work with the caller as author", async () => {
    const { contract, author } = await deploy();
    const price = ethers.parseEther("0.01");

    await expect(
      contract.connect(author).registerWork("ipfs://work-1", price, 0)
    )
      .to.emit(contract, "WorkRegistered")
      .withArgs(1n, author.address, "ipfs://work-1", price, 0n);

    expect(await contract.totalWorks()).to.equal(1n);
  });

  it("mints a copy and forwards payment to the author", async () => {
    const { contract, author, reader } = await deploy();
    const price = ethers.parseEther("0.01");
    await contract.connect(author).registerWork("ipfs://work-1", price, 2);

    await expect(
      contract.connect(reader).mintCopy(1, { value: price })
    ).to.changeEtherBalance(author, price);

    expect(await contract.ownerOf(1)).to.equal(reader.address);
    expect(await contract.tokenURI(1)).to.equal("ipfs://work-1");
  });

  it("reverts when payment is insufficient", async () => {
    const { contract, author, reader } = await deploy();
    const price = ethers.parseEther("0.01");
    await contract.connect(author).registerWork("ipfs://work-1", price, 0);

    await expect(
      contract.connect(reader).mintCopy(1, { value: 0 })
    ).to.be.revertedWithCustomError(contract, "InsufficientPayment");
  });

  it("reverts when the work is sold out", async () => {
    const { contract, author, reader } = await deploy();
    await contract.connect(author).registerWork("ipfs://work-1", 0, 1);
    await contract.connect(reader).mintCopy(1);

    await expect(
      contract.connect(reader).mintCopy(1)
    ).to.be.revertedWithCustomError(contract, "SoldOut");
  });

  it("lets the copy owner set per-token metadata for numbered editions", async () => {
    const { contract, author, reader } = await deploy();
    await contract.connect(author).registerWork("ipfs://work-1", 0, 10);
    await contract.connect(reader).mintCopy(1);

    await expect(
      contract.connect(reader).setCopyMetadataURI(1, "ipfs://token-1-copy")
    )
      .to.emit(contract, "CopyMetadataUpdated")
      .withArgs(1n, "ipfs://token-1-copy");

    expect(await contract.tokenURI(1)).to.equal("ipfs://token-1-copy");
  });

  it("reverts when a non-owner sets per-token metadata", async () => {
    const { contract, author, reader, owner } = await deploy();
    await contract.connect(author).registerWork("ipfs://work-1", 0, 10);
    await contract.connect(reader).mintCopy(1);

    await expect(
      contract.connect(owner).setCopyMetadataURI(1, "ipfs://hijack")
    ).to.be.revertedWithCustomError(contract, "NotCopyOwner");
  });

  it("reverts when setting metadata for a nonexistent token", async () => {
    const { contract, reader } = await deploy();

    await expect(
      contract.connect(reader).setCopyMetadataURI(999, "ipfs://ghost")
    ).to.be.revertedWithCustomError(contract, "ERC721NonexistentToken");
  });
});
