import { establishWalletSession } from "@/lib/auth/establish-wallet-session";
import { enforceRateLimit, errorResponse, jsonResponse } from "@/lib/authors/api-utils";
import { walletAuthSchema } from "@/lib/authors/schemas";
import {
  buildClearWalletSessionCookie,
  buildWalletSessionCookie,
  parseCookieHeader,
  WALLET_SESSION_COOKIE_NAME,
} from "@/lib/auth/wallet-session-cookies";
import { getWalletSessionService } from "@/lib/auth/wallet-session-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = walletAuthSchema.parse(await request.json());
    const limited = await enforceRateLimit(request, `auth-session:${body.address}`);
    if (limited) {
      return limited;
    }

    const session = await establishWalletSession(body);
    const response = jsonResponse({
      active: true,
      expiresAt: session.expiresAt.toISOString(),
    });
    response.headers.append(
      "Set-Cookie",
      buildWalletSessionCookie(session.sessionId, session.expiresAt),
    );
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const sessionId = parseCookieHeader(
      request.headers.get("cookie"),
      WALLET_SESSION_COOKIE_NAME,
    );
    if (sessionId) {
      const sessionService = await getWalletSessionService();
      await sessionService.revoke(sessionId);
    }

    const response = jsonResponse({ revoked: true });
    response.headers.append("Set-Cookie", buildClearWalletSessionCookie());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
