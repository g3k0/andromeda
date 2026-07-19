import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  getConnectSrcAllowlist,
} from "../../../content-security-policy.mjs";

describe("content security policy", () => {
  it("allows Alchemy and WalletConnect RPC endpoints", () => {
    const allowlist = getConnectSrcAllowlist().join(" ");
    expect(allowlist).toContain("https://*.g.alchemy.com");
    expect(allowlist).toContain("wss://*.walletconnect.com");
  });

  it("builds a complete CSP directive string", () => {
    const policy = buildContentSecurityPolicy();
    expect(policy).toContain("connect-src");
    expect(policy).toContain("frame-ancestors 'none'");
  });
});
