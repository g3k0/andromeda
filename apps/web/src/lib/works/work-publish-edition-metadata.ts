import type { Abi } from "viem";
import type { Log } from "viem";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { SignedWalletPayload } from "@/lib/auth/client-wallet-auth";

import { buildSetCopyMetadataRequest } from "./mint-copy-tx";
import {
  extractRegisteredCopies,
  extractRegisteredWorkId,
} from "./register-receipt";

export type PinEditionMetadataCopyInput = {
  tokenId: bigint;
  copyNumber: number;
};

export type PinEditionMetadataInput = {
  workId: bigint;
  authorAddress: string;
  workMetadata: AcePublicMetadata;
  maxCopies: bigint;
  copies: readonly PinEditionMetadataCopyInput[];
  walletAuth: SignedWalletPayload;
  fetchImpl?: typeof fetch;
};

export type PinEditionMetadataResult = {
  tokenId: bigint;
  copyNumber: number;
  metadataUri: string;
};

export async function pinEditionMetadataForAuthor(
  input: PinEditionMetadataInput,
): Promise<PinEditionMetadataResult[]> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `/api/works/${input.workId.toString()}/edition-metadata`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAuth: input.walletAuth,
        authorAddress: input.authorAddress,
        maxCopies: input.maxCopies.toString(),
        copies: input.copies.map((copy) => ({
          tokenId: copy.tokenId.toString(),
          copyNumber: copy.copyNumber,
        })),
        workMetadata: input.workMetadata,
      }),
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Failed to pin numbered edition metadata.");
  }

  const json = (await response.json()) as {
    copies: Array<{
      tokenId: string;
      copyNumber: number;
      metadataUri: string;
    }>;
  };

  return json.copies.map((copy) => ({
    tokenId: BigInt(copy.tokenId),
    copyNumber: copy.copyNumber,
    metadataUri: copy.metadataUri,
  }));
}

export type WriteCopyMetadataInput = {
  copies: readonly PinEditionMetadataResult[];
  contractAddress: `0x${string}`;
  abi: Abi;
  writeContractAsync: (request: ReturnType<typeof buildSetCopyMetadataRequest>) => Promise<`0x${string}`>;
};

export async function writeCopyMetadataUris(
  input: WriteCopyMetadataInput,
): Promise<void> {
  for (const copy of input.copies) {
    await input.writeContractAsync(
      buildSetCopyMetadataRequest({
        tokenId: copy.tokenId,
        metadataUri: copy.metadataUri,
        contractAddress: input.contractAddress,
        abi: input.abi,
      }),
    );
  }
}

export type CompleteEditionMetadataInput = {
  logs: readonly Log[];
  authorAddress: string;
  workMetadata: AcePublicMetadata;
  maxCopies: bigint;
  walletAuth: SignedWalletPayload;
  contractAddress: `0x${string}`;
  abi: Abi;
  writeContractAsync: WriteCopyMetadataInput["writeContractAsync"];
  fetchImpl?: typeof fetch;
};

export async function completeEditionMetadataAfterRegister(
  input: CompleteEditionMetadataInput,
): Promise<{ workId: bigint; labeledCopies: number }> {
  const workId = extractRegisteredWorkId(input.logs);
  const mintedCopies = extractRegisteredCopies(input.logs).map((copy) => ({
    tokenId: copy.tokenId,
    copyNumber: Number(copy.copyNumber),
  }));

  if (mintedCopies.length === 0) {
    return { workId, labeledCopies: 0 };
  }

  const pinned = await pinEditionMetadataForAuthor({
    workId,
    authorAddress: input.authorAddress,
    workMetadata: input.workMetadata,
    maxCopies: input.maxCopies,
    copies: mintedCopies,
    walletAuth: input.walletAuth,
    fetchImpl: input.fetchImpl,
  });

  await writeCopyMetadataUris({
    copies: pinned,
    contractAddress: input.contractAddress,
    abi: input.abi,
    writeContractAsync: input.writeContractAsync,
  });

  return { workId, labeledCopies: pinned.length };
}
