import {
  ApiClientError,
  parseApiErrorBody,
} from "@/lib/i18n/api-error-messages";

export type SignMessageFn = (args: {
  message: string;
}) => Promise<`0x${string}`>;

export type SignedWalletPayload = {
  address: string;
  message: string;
  signature: `0x${string}`;
};

export async function createSignedWalletPayload(
  address: string,
  signMessageAsync: SignMessageFn,
): Promise<SignedWalletPayload> {
  const response = await fetch(
    `/api/auth/message?address=${encodeURIComponent(address)}`,
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    const parsed = parseApiErrorBody(body);
    if (parsed) {
      throw new ApiClientError(parsed.code, parsed.params);
    }
    throw new ApiClientError("wallet_auth_message_failed");
  }

  const { message } = (await response.json()) as { message: string };
  const signature = await signMessageAsync({ message });

  return {
    address,
    message,
    signature,
  };
}
