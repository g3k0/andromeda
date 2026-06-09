import { errorResponse, jsonResponse } from "@/lib/authors/api-utils";
import {
  parseCookieHeader,
  WALLET_SESSION_COOKIE_NAME,
} from "@/lib/auth/wallet-session-cookies";
import { getWalletSessionService } from "@/lib/auth/wallet-session-server";

export async function GET(request: Request): Promise<Response> {
  try {
    const sessionId = parseCookieHeader(
      request.headers.get("cookie"),
      WALLET_SESSION_COOKIE_NAME,
    );
    const sessionService = await getWalletSessionService();
    const status = await sessionService.getStatus(sessionId);
    return jsonResponse(status);
  } catch (error) {
    return errorResponse(error);
  }
}
