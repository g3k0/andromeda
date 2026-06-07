import {
  enforceRateLimit,
  errorResponse,
  jsonResponse,
} from "@/lib/users/api-utils";
import { runCreateUserMutation, runListUsersMutation } from "@/lib/users/user-mutations";
import { createUserBodySchema } from "@/lib/users/schemas";

export async function GET(request: Request): Promise<Response> {
  try {
    const limited = enforceRateLimit(request, "list-users");
    if (limited) {
      return limited;
    }

    const users = await runListUsersMutation(request);
    return jsonResponse(users);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = createUserBodySchema.parse(await request.json());
    const limited = enforceRateLimit(request, `create-user:${body.targetAddress}`);
    if (limited) {
      return limited;
    }

    const user = await runCreateUserMutation(body);
    return jsonResponse(user, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
