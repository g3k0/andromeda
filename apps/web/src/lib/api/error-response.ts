import type { ApiErrorCode } from "@/lib/i18n/api-error-codes";
import type { TranslationParams } from "@/lib/i18n/types";

export type ApiErrorBody = {
  error: string;
  code: ApiErrorCode;
  params?: TranslationParams;
};

export function buildApiErrorBody(
  error: unknown,
  mapStatus: (value: unknown) => number,
  mapMessage: (value: unknown) => string,
  mapCode: (value: unknown) => ApiErrorCode,
  mapParams?: (value: unknown) => TranslationParams | undefined,
): ApiErrorBody {
  const status = mapStatus(error);
  const code = status >= 500 ? "unexpected" : mapCode(error);
  const params = status >= 500 ? undefined : mapParams?.(error);

  return {
    error: status >= 500 ? "Unexpected server error." : mapMessage(error),
    code,
    ...(params ? { params } : {}),
  };
}
