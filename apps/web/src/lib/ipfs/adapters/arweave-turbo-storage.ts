import { logServerError } from "@/lib/logging/server-logger";

import { toArweaveUri, type ContentUri } from "../content-uri";
import { ArweaveUploadError } from "../errors";
import {
  DEFAULT_ARWEAVE_GATEWAY_BASE_URL,
  toContentGatewayUrl,
} from "../gateway-url";
import type {
  PermanentStoragePort,
  UploadOptions,
  UploadResult,
} from "../ports/permanent-storage-port";
import type {
  TurboDataItemTag,
  TurboUploadClient,
} from "../ports/turbo-upload-client";

export const ANDROMEDA_APP_NAME_TAG: TurboDataItemTag = {
  name: "App-Name",
  value: "Andromeda",
};

export type ArweaveTurboStorageConfig = {
  client: TurboUploadClient;
  gatewayBaseUrl?: string;
  /** Extra tags appended after Content-Type / App-Name / optional File-Name. */
  extraTags?: readonly TurboDataItemTag[];
  fetchImpl?: typeof fetch;
};

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

function buildTags(params: {
  contentType: string;
  name?: string;
  extraTags?: readonly TurboDataItemTag[];
}): TurboDataItemTag[] {
  const tags: TurboDataItemTag[] = [
    { name: "Content-Type", value: params.contentType },
    ANDROMEDA_APP_NAME_TAG,
  ];
  if (params.name?.trim()) {
    tags.push({ name: "File-Name", value: params.name.trim() });
  }
  if (params.extraTags?.length) {
    tags.push(...params.extraTags);
  }
  return tags;
}

async function uploadWithClient(
  client: TurboUploadClient,
  data: Uint8Array | string,
  size: number,
  tags: TurboDataItemTag[],
): Promise<UploadResult> {
  try {
    const result = await client.upload({
      data,
      dataItemOpts: { tags },
    });
    const id = result.id?.trim();
    if (!id) {
      throw new ArweaveUploadError("Arweave upload returned an empty id");
    }
    return {
      id,
      uri: toArweaveUri(id),
      size,
    };
  } catch (error) {
    if (error instanceof ArweaveUploadError) {
      throw error;
    }
    logServerError(
      "ipfs.arweave",
      "turbo_upload_error",
      "Arweave Turbo upload failed",
      {
        errorName: error instanceof Error ? error.name : "unknown",
      },
    );
    throw new ArweaveUploadError("Failed to upload data to Arweave");
  }
}

/** Permanent storage adapter backed by ArDrive Turbo → Arweave. */
export function createArweaveTurboStorage(
  config: ArweaveTurboStorageConfig,
): PermanentStoragePort {
  const gatewayBaseUrl = (
    config.gatewayBaseUrl ?? DEFAULT_ARWEAVE_GATEWAY_BASE_URL
  ).replace(/\/+$/, "");
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    async uploadBlob(
      data: Uint8Array,
      options?: UploadOptions,
    ): Promise<UploadResult> {
      return uploadWithClient(
        config.client,
        data,
        data.byteLength,
        buildTags({
          contentType: "application/octet-stream",
          name: options?.name,
          extraTags: config.extraTags,
        }),
      );
    },

    async uploadJson(
      data: unknown,
      options?: UploadOptions,
    ): Promise<UploadResult> {
      const body = JSON.stringify(data);
      return uploadWithClient(
        config.client,
        body,
        utf8ByteLength(body),
        buildTags({
          contentType: "application/json",
          name: options?.name,
          extraTags: config.extraTags,
        }),
      );
    },

    toGatewayUrl(uri: ContentUri | string): string {
      return toContentGatewayUrl(uri, {
        ipfs: "https://gateway.pinata.cloud/ipfs",
        arweave: gatewayBaseUrl,
      });
    },

    async fetchBytes(uri: ContentUri): Promise<Uint8Array> {
      const url = toContentGatewayUrl(uri, {
        ipfs: "https://gateway.pinata.cloud/ipfs",
        arweave: gatewayBaseUrl,
      });
      let response: Response;
      try {
        response = await fetchImpl(url);
      } catch {
        logServerError(
          "ipfs.arweave",
          "gateway_fetch_error",
          "Arweave gateway fetch failed",
          { uriScheme: uri.startsWith("ar://") ? "ar" : "other" },
        );
        throw new ArweaveUploadError("Failed to fetch bytes from Arweave");
      }
      if (!response.ok) {
        logServerError(
          "ipfs.arweave",
          "gateway_http_error",
          "Arweave gateway returned an error status",
          { status: response.status },
        );
        throw new ArweaveUploadError("Failed to fetch bytes from Arweave");
      }
      return new Uint8Array(await response.arrayBuffer());
    },
  };
}
