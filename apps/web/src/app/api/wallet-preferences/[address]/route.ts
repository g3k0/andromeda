import { runSetWalletPreferencesMutation } from "@/lib/authors/author-mutations";
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/authors/api-utils";
import { normalizeAddress } from "@/lib/authors/address";
import { walletPreferencesBodySchema } from "@/lib/authors/schemas";

type RouteContext = {
  params: Promise<{ address: string }>;
};

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { address: addressParam } = await context.params;
    const normalized = normalizeAddress(addressParam);
    if (!normalized) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const limited = await enforceRateLimit(
      request,
      `wallet-preferences:${normalized}`,
    );
    if (limited) {
      return limited;
    }

    console.warn(
      "Deprecated API: PUT /api/wallet-preferences writes to users.preferences only.",
    );

    const body = walletPreferencesBodySchema.parse(await request.json());
    const preferences = await runSetWalletPreferencesMutation(normalized, body);
    return jsonResponse(preferences);
  } catch (error) {
    return errorResponse(error);
  }
}
