import "server-only";

import { ArweaveSigner, createData } from "@dha-team/arbundles";

import type { ArweaveJwk } from "../arweave-jwk";
import { ArweaveUploadError } from "../errors";
import type {
  TurboUploadClient,
  TurboUploadParams,
} from "../ports/turbo-upload-client";

/** Production Turbo upload service (ANS-104 data items). */
export const DEFAULT_TURBO_UPLOAD_SERVICE_URL = "https://upload.ardrive.io";

export type TurboHttpUploadClientConfig = {
  jwk: ArweaveJwk;
  /** Defaults to {@link DEFAULT_TURBO_UPLOAD_SERVICE_URL}. */
  uploadServiceUrl?: string;
  /** Payment / signature token path segment (default `arweave`). */
  token?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Minimal Arweave Turbo uploader: sign with arbundles, POST to Turbo `/v1/tx/:token`.
 *
 * Avoids `@ardrive/turbo-sdk` (and its Solana → rpc-websockets → uuid ESM crash on Vercel).
 */
export function createTurboHttpUploadClient(
  config: TurboHttpUploadClientConfig,
): TurboUploadClient {
  const baseUrl = (
    config.uploadServiceUrl ?? DEFAULT_TURBO_UPLOAD_SERVICE_URL
  ).replace(/\/+$/, "");
  const token = config.token?.trim() || "arweave";
  const fetchImpl = config.fetchImpl ?? fetch;
  const signer = new ArweaveSigner(
    config.jwk as unknown as ConstructorParameters<typeof ArweaveSigner>[0],
  );

  return {
    async upload(params: TurboUploadParams) {
      const payload =
        typeof params.data === "string"
          ? new TextEncoder().encode(params.data)
          : params.data;
      const tags =
        params.dataItemOpts?.tags?.map((tag) => ({
          name: tag.name,
          value: tag.value,
        })) ?? [];

      const dataItem = createData(payload, signer, { tags });
      await dataItem.sign(signer);
      // arbundles returns a Node Buffer; wrap for Fetch BodyInit typing.
      const raw = Uint8Array.from(dataItem.getRaw());

      const response = await fetchImpl(`${baseUrl}/v1/tx/${token}`, {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
          "content-length": String(raw.byteLength),
        },
        body: raw,
      });

      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 200);
        throw new ArweaveUploadError(
          `Turbo upload failed (${response.status})${detail ? `: ${detail}` : ""}`,
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      let responseId: string | undefined;
      let winc: string | undefined;
      if (contentType.includes("application/json")) {
        const json = (await response.json()) as {
          id?: unknown;
          winc?: unknown;
        };
        if (typeof json.id === "string") {
          responseId = json.id.trim();
        }
        if (typeof json.winc === "string") {
          winc = json.winc;
        }
      }

      const id = responseId || dataItem.id?.trim();
      if (!id) {
        throw new ArweaveUploadError("Turbo upload returned an empty id");
      }
      return { id, winc };
    },
  };
}
