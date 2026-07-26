import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  getConnectSrcAllowlist,
} from "../../../content-security-policy.mjs";

describe("content security policy", () => {
  it("allows Alchemy, WalletConnect, Pinata, and Arweave endpoints", () => {
    const allowlist = getConnectSrcAllowlist().join(" ");
    expect(allowlist).toContain("https://*.g.alchemy.com");
    expect(allowlist).toContain("wss://*.walletconnect.com");
    expect(allowlist).toContain("https://gateway.pinata.cloud");
    expect(allowlist).toContain("https://arweave.net");
    expect(allowlist).toContain("https://*.ar.io");
  });

  it("builds a complete CSP directive string", () => {
    const policy = buildContentSecurityPolicy();
    expect(policy).toContain("connect-src");
    expect(policy).toContain("img-src");
    expect(policy).toContain("https://arweave.net");
    expect(policy).toContain("font-src");
    expect(policy).toContain("https://fonts.gstatic.com");
    expect(policy).toContain("frame-ancestors 'none'");
  });
});
