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
    throw new Error("Failed to create wallet authentication message.");
  }

  const { message } = (await response.json()) as { message: string };
  const signature = await signMessageAsync({ message });

  return {
    address,
    message,
    signature,
  };
}
