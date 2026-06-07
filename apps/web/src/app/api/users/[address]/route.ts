import { normalizeAddress } from "@/lib/authors/address";
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/users/api-utils";
import { updateUserBodySchema } from "@/lib/users/schemas";
import {
  runDeleteUserMutation,
  runGetUserMutation,
  runUpdateUserMutation,
} from "@/lib/users/user-mutations";

type RouteContext = {
  params: Promise<{ address: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { address: addressParam } = await context.params;
    const normalized = normalizeAddress(addressParam);
    if (!normalized) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const limited = enforceRateLimit(request, `get-user:${normalized}`);
    if (limited) {
      return limited;
    }

    const user = await runGetUserMutation(request, normalized);
    return jsonResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { address: addressParam } = await context.params;
    const normalized = normalizeAddress(addressParam);
    if (!normalized) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const limited = enforceRateLimit(request, `patch-user:${normalized}`);
    if (limited) {
      return limited;
    }

    const body = updateUserBodySchema.parse(await request.json());
    const user = await runUpdateUserMutation(normalized, body);
    return jsonResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { address: addressParam } = await context.params;
    const normalized = normalizeAddress(addressParam);
    if (!normalized) {
      return jsonResponse({ error: "Invalid Ethereum address." }, 400);
    }

    const limited = enforceRateLimit(request, `delete-user:${normalized}`);
    if (limited) {
      return limited;
    }

    await runDeleteUserMutation(request, normalized);
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
