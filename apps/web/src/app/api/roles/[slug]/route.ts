import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/roles/api-utils";
import {
  runDeleteRoleMutation,
  runGetRoleMutation,
  runUpdateRoleMutation,
} from "@/lib/roles/role-mutations";
import { updateRoleApiBodySchema } from "@/lib/roles/schemas";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const limited = enforceRateLimit(request, `get-role:${slug}`);
    if (limited) {
      return limited;
    }

    const role = await runGetRoleMutation(request, slug);
    return jsonResponse(role);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const limited = enforceRateLimit(request, `patch-role:${slug}`);
    if (limited) {
      return limited;
    }

    const body = updateRoleApiBodySchema.parse(await request.json());
    const role = await runUpdateRoleMutation(slug, body);
    return jsonResponse(role);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const limited = enforceRateLimit(request, `delete-role:${slug}`);
    if (limited) {
      return limited;
    }

    await runDeleteRoleMutation(request, slug);
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
