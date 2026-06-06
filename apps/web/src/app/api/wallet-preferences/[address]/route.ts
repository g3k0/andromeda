import { assertCanManageWalletPreferences } from "@/lib/authors/authorize";
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/authors/api-utils";
import { normalizeAddress } from "@/lib/authors/address";
import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { walletPreferencesBodySchema } from "@/lib/authors/schemas";
import { getAuthorService } from "@/lib/authors/server";

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

    const limited = enforceRateLimit(
      request,
      `wallet-preferences:${normalized}`,
    );
    if (limited) {
      return limited;
    }

    const body = walletPreferencesBodySchema.parse(await request.json());
    const signer = await verifySignedMutation(body);
    assertCanManageWalletPreferences(signer, normalized);

    const service = await getAuthorService();
    const preferences = await service.setWalletPreferences(normalized, {
      declinedAuthorPage: body.declinedAuthorPage,
    });

    return jsonResponse(preferences);
  } catch (error) {
    return errorResponse(error);
  }
}
