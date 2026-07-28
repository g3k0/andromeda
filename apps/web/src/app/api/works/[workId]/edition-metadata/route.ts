import { z } from "zod";

import { verifySignedMutation } from "@/lib/authors/mutation-handler";
import { walletAuthSchema } from "@/lib/authors/schemas";
import { acePublicMetadataSchema } from "@/lib/ipfs/metadata-schema";
import { provisionEditionMetadata } from "@/lib/works/edition-metadata-service";
import { getPermanentStorage } from "@/lib/works/ipfs-server";
import { jsonResponse, workErrorResponse } from "@/lib/works/api-utils";
import { parseWorkIdParam } from "@/lib/works/token-envelope-service";

const copySchema = z.object({
  tokenId: z.string().regex(/^\d+$/),
  copyNumber: z.number().int().positive(),
});

const bodySchema = z.object({
  walletAuth: walletAuthSchema,
  authorAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  maxCopies: z.string().regex(/^\d+$/),
  copies: z.array(copySchema).min(1),
  workMetadata: acePublicMetadataSchema,
});

type RouteContext = {
  params: Promise<{ workId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { workId: workIdParam } = await context.params;
    const workId = parseWorkIdParam(workIdParam);
    const parsed = bodySchema.parse(await request.json());
    const signer = await verifySignedMutation(parsed.walletAuth);

    const copies = parsed.copies.map((copy) => ({
      tokenId: BigInt(copy.tokenId),
      copyNumber: copy.copyNumber,
    }));

    const provisioned = await provisionEditionMetadata(getPermanentStorage(), {
      signerAddress: signer,
      authorAddress: parsed.authorAddress,
      workMetadata: parsed.workMetadata,
      maxCopies: BigInt(parsed.maxCopies),
      copies,
    });

    return jsonResponse(
      {
        workId: workId.toString(),
        copies: provisioned.map((copy) => ({
          tokenId: copy.tokenId.toString(),
          copyNumber: copy.copyNumber,
          metadataUri: copy.metadataUri,
        })),
      },
      201,
    );
  } catch (error) {
    return workErrorResponse(error);
  }
}
