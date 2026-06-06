import { createWalletAuthMessage } from "@/lib/auth/verify-wallet";
import { normalizeAddress } from "@/lib/authors/address";
import { errorResponse, jsonResponse } from "@/lib/authors/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    if (!address || !normalizeAddress(address)) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const challenge = createWalletAuthMessage(address);
    return jsonResponse(challenge);
  } catch (error) {
    return errorResponse(error);
  }
}
