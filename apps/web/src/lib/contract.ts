import type { Abi } from "viem";

export const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "") as `0x${string}`;

// Minimal ABI for the Andromeda ERC-721 work registry.
// Replace/extend with the full ABI generated from packages/contracts after deploy.
export const andromedaAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "totalWorks",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "mintCopy",
    stateMutability: "payable",
    inputs: [{ name: "workId", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const satisfies Abi;
