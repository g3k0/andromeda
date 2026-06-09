import { createWalletAuthMessage } from "@/lib/auth/verify-wallet";
import { normalizeAddress } from "@/lib/authors/address";
import { enforceRateLimit, errorResponse, jsonResponse } from "@/lib/authors/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const normalized = address ? normalizeAddress(address) : null;
    if (!normalized) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const limited = await enforceRateLimit(
      request,
      `auth-message:${normalized}`,
      10,
    );
    if (limited) {
      return limited;
    }

    const challenge = await createWalletAuthMessage(normalized);
    return jsonResponse(challenge);
  } catch (error) {
    return errorResponse(error);
  }
}
