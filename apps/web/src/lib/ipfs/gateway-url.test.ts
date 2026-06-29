import { describe, expect, it } from "vitest";

import { toGatewayUrl } from "./gateway-url";
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
