import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

/**
 * @ardrive/turbo-sdk → @solana/web3.js → rpc-websockets loads uuid via
 * CommonJS require(). uuid@12+ is ESM-only and crashes Vercel serverless
 * (ERR_REQUIRE_ESM). Root pnpm override pins uuid@11 (last CJS build).
 */
describe("uuid CommonJS interop for Turbo / rpc-websockets", () => {
  it("supports require() so serverless can load the Turbo SDK", () => {
    const require = createRequire(import.meta.url);
    const uuid = require("uuid") as { v4: () => string };
    expect(typeof uuid.v4).toBe("function");
    expect(uuid.v4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
