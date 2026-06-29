import { describe, expect, it } from "vitest";

import { asCid, parseIpfsUri, toIpfsUri } from "./types";

describe("ipfs types", () => {
  it("builds and parses ipfs URIs", () => {
    const cid = asCid("bafybeiabc123");
    expect(toIpfsUri(cid)).toBe("ipfs://bafybeiabc123");
    expect(parseIpfsUri("ipfs://bafybeiabc123")).toBe(cid);
  });

  it("rejects invalid ipfs URIs", () => {
    expect(() => parseIpfsUri("https://example.test/ipfs/cid")).toThrow(
      /Expected ipfs:\/\//,
    );
    expect(() => parseIpfsUri("ipfs://")).toThrow(/include a CID/);
  });
});
