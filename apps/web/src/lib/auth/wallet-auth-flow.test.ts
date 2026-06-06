import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/auth/message/route";
import {
  resetWalletAuthStoreForTests,
  verifyWalletSignature,
} from "./verify-wallet";

const ACCOUNT = privateKeyToAccount(generatePrivateKey());

describe("wallet auth flow", () => {
  afterEach(() => {
    resetWalletAuthStoreForTests();
  });

  it("verifies a nonce issued by GET /api/auth/message", async () => {
    const response = await GET(
      new Request(
        `http://localhost/api/auth/message?address=${ACCOUNT.address}`,
      ),
    );

    expect(response.status).toBe(200);
    const { message } = (await response.json()) as { message: string };
    const signature = await ACCOUNT.signMessage({ message });

    await expect(
      verifyWalletSignature({
        address: ACCOUNT.address,
        message,
        signature,
      }),
    ).resolves.toBe(ACCOUNT.address.toLowerCase());
  });
});
