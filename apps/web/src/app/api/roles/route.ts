import { createRoleApiBodySchema } from "@/lib/roles/schemas";
import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/roles/api-utils";
import {
  runCreateRoleMutation,
  runListRolesMutation,
} from "@/lib/roles/role-mutations";

export async function GET(request: Request): Promise<Response> {
  try {
    const limited = await enforceRateLimit(request, "list-roles");
    if (limited) {
      return limited;
    }

    const roles = await runListRolesMutation(request);
    return jsonResponse(roles);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = createRoleApiBodySchema.parse(await request.json());
    const limited = await enforceRateLimit(request, `create-role:${body.slug}`);
    if (limited) {
      return limited;
    }

    const role = await runCreateRoleMutation(body);
    return jsonResponse(role, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
