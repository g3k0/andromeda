import { parseIpfsUri, type Cid } from "./types";

export function toGatewayUrl(
  cidOrUri: Cid | string,
  gatewayBaseUrl: string,
): string {
  const base = gatewayBaseUrl.replace(/\/+$/, "");
  const cid =
    typeof cidOrUri === "string" && cidOrUri.startsWith("ipfs://")
      ? parseIpfsUri(cidOrUri)
      : (cidOrUri as Cid);

  return `${base}/${cid}`;
}
