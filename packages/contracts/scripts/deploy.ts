import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  const factory = await ethers.getContractFactory("AndromedaWorks");
  const contract = await factory.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`AndromedaWorks deployed at: ${address}`);
  console.log(
    "Set NEXT_PUBLIC_CONTRACT_ADDRESS in apps/web/.env.local to this address."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
