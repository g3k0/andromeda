import { expect } from "chai";
import { ethers } from "hardhat";

describe("AndromedaWorks", () => {
  async function expectRevert(promise: Promise<unknown>) {
    try {
      await promise;
      expect.fail("Expected transaction to revert");
    } catch {
      // expected
    }
  }

  async function deploy() {
    const [owner, author, reader] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("AndromedaWorks");
    const contract = await factory.deploy(owner.address);
    await contract.waitForDeployment();
    return { contract, owner, author, reader };
  }

  it("registers a work and mints the full edition to the author", async () => {
    const { contract, author } = await deploy();
    const price = ethers.parseEther("0.01");

    await contract.connect(author).registerWork("ipfs://work-1", price, 2);

    expect(await contract.totalWorks()).to.equal(1n);
    expect(await contract.ownerOf(1)).to.equal(author.address);
    expect(await contract.ownerOf(2)).to.equal(author.address);
    expect(await contract.primarySaleRemaining(1)).to.equal(2n);
    expect((await contract.works(1)).minted).to.equal(2n);
    expect(await contract.copyNumberOfToken(1)).to.equal(1n);
    expect(await contract.copyNumberOfToken(2)).to.equal(2n);
  });

  it("reverts when maxCopies is zero", async () => {
    const { contract, author } = await deploy();

    await expectRevert(
      contract.connect(author).registerWork("ipfs://work-1", 0, 0),
    );
  });

  it("sells a copy from the author inventory and forwards payment", async () => {
    const { contract, author, reader } = await deploy();
    const price = ethers.parseEther("0.01");
    await contract.connect(author).registerWork("ipfs://work-1", price, 2);

    const authorBalanceBefore = await ethers.provider.getBalance(author.address);
    const tx = await contract.connect(reader).mintCopy(1, { value: price });
    const receipt = await tx.wait();
    const authorBalanceAfter = await ethers.provider.getBalance(author.address);

    expect(receipt).to.not.equal(null);
    expect(authorBalanceAfter - authorBalanceBefore).to.equal(price);
    expect(await contract.ownerOf(2)).to.equal(reader.address);
    expect(await contract.primarySaleRemaining(1)).to.equal(1n);
  });

  it("reverts when payment is insufficient", async () => {
    const { contract, author, reader } = await deploy();
    const price = ethers.parseEther("0.01");
    await contract.connect(author).registerWork("ipfs://work-1", price, 1);

    await expectRevert(contract.connect(reader).mintCopy(1, { value: 0 }));
  });

  it("reverts when the primary sale inventory is sold out", async () => {
    const { contract, author, reader } = await deploy();
    await contract.connect(author).registerWork("ipfs://work-1", 0, 1);
    await contract.connect(reader).mintCopy(1);

    await expectRevert(contract.connect(reader).mintCopy(1));
  });

  it("reverts when primary sales are inactive", async () => {
    const { contract, author, reader } = await deploy();
    await contract.connect(author).registerWork("ipfs://work-1", 0, 1);
    await contract.connect(author).setWorkActive(1, false);

    await expectRevert(contract.connect(reader).mintCopy(1));
  });

  it("lets the copy owner set per-token metadata for numbered editions", async () => {
    const { contract, author, reader } = await deploy();
    await contract.connect(author).registerWork("ipfs://work-1", 0, 10);
    await contract.connect(reader).mintCopy(1);

    await contract.connect(reader).setCopyMetadataURI(10, "ipfs://token-10-copy");

    expect(await contract.tokenURI(10)).to.equal("ipfs://token-10-copy");
  });

  it("reverts when a non-owner sets per-token metadata", async () => {
    const { contract, author, reader, owner } = await deploy();
    await contract.connect(author).registerWork("ipfs://work-1", 0, 10);
    await contract.connect(reader).mintCopy(1);

    await expectRevert(
      contract.connect(owner).setCopyMetadataURI(10, "ipfs://hijack"),
    );
  });

  it("reverts when setting metadata for a nonexistent token", async () => {
    const { contract, reader } = await deploy();

    await expectRevert(
      contract.connect(reader).setCopyMetadataURI(999, "ipfs://ghost"),
    );
  });

  it("lets the copy owner set the ACE envelope URI", async () => {
    const { contract, author, reader } = await deploy();
    await contract.connect(author).registerWork("ar://work-1", 0, 10);
    await contract.connect(reader).mintCopy(1);

    await contract
      .connect(reader)
      .setCopyEnvelopeURI(10, "ar://token-10-envelope");

    expect(await contract.envelopeURIOfToken(10)).to.equal(
      "ar://token-10-envelope",
    );
  });

  it("lets the work author set the envelope URI after a sale", async () => {
    const { contract, author, reader } = await deploy();
    await contract.connect(author).registerWork("ar://work-1", 0, 10);
    await contract.connect(reader).mintCopy(1);

    await contract
      .connect(author)
      .setCopyEnvelopeURI(10, "ar://author-provisioned");

    expect(await contract.envelopeURIOfToken(10)).to.equal(
      "ar://author-provisioned",
    );
  });

  it("reverts when a stranger sets the envelope URI", async () => {
    const { contract, author, reader, owner } = await deploy();
    await contract.connect(author).registerWork("ar://work-1", 0, 10);
    await contract.connect(reader).mintCopy(1);

    await expectRevert(
      contract.connect(owner).setCopyEnvelopeURI(10, "ar://hijack"),
    );
  });
});
