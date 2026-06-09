export function getWalletConnectProjectId(): string {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
}

export function getPublicChainName(): "polygon" | "polygonAmoy" {
  return process.env.NEXT_PUBLIC_CHAIN === "polygon" ? "polygon" : "polygonAmoy";
}

export function getContractAddress(): `0x${string}` {
  return (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;
}
