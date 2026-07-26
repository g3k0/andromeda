import { describe, expect, it } from "vitest";

import { toContentGatewayUrl, toGatewayUrl } from "./gateway-url";
import { asCid } from "./types";

describe("toGatewayUrl", () => {
  it("builds gateway URLs from CIDs", () => {
    const cid = asCid("bafybeiabc123");
    expect(toGatewayUrl(cid, "https://gateway.pinata.cloud/ipfs")).toBe(
      "https://gateway.pinata.cloud/ipfs/bafybeiabc123",
    );
  });

  it("accepts ipfs:// URIs and trims trailing slashes on the base", () => {
    expect(
      toGatewayUrl(
        "ipfs://bafybeiabc123",
        "https://gateway.pinata.cloud/ipfs/",
      ),
    ).toBe("https://gateway.pinata.cloud/ipfs/bafybeiabc123");
  });
});

describe("toContentGatewayUrl", () => {
  const gateways = {
    ipfs: "https://gateway.pinata.cloud/ipfs",
    arweave: "https://arweave.net",
  };

  it("resolves ipfs:// and raw CIDs via the IPFS gateway", () => {
    expect(toContentGatewayUrl("ipfs://bafybeiabc123", gateways)).toBe(
      "https://gateway.pinata.cloud/ipfs/bafybeiabc123",
    );
    expect(toContentGatewayUrl("bafybeiabc123", gateways)).toBe(
      "https://gateway.pinata.cloud/ipfs/bafybeiabc123",
    );
  });

  it("resolves ar:// via the Arweave gateway and trims trailing slashes", () => {
    expect(
      toContentGatewayUrl("ar://TxId123", {
        ...gateways,
        arweave: "https://arweave.net/",
      }),
    ).toBe("https://arweave.net/TxId123");
  });
});
