import { toGatewayUrl } from "../gateway-url";
import { IpfsPinError } from "../errors";
import type { IpfsStoragePort } from "../ports/ipfs-storage-port";
import { asCid, toIpfsUri, type PinOptions, type PinResult } from "../types";

const DEFAULT_PIN_JSON_URL =
  "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const DEFAULT_PIN_FILE_URL =
  "https://api.pinata.cloud/pinning/pinFileToIPFS";

export type PinataIpfsStorageConfig = {
  apiKey: string;
  gatewayBaseUrl: string;
  fetchImpl?: typeof fetch;
  pinJsonUrl?: string;
  pinFileUrl?: string;
};

type PinataPinResponse = {
  IpfsHash: string;
  PinSize: number | string;
};

function buildAuthHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

function toPinResult(payload: PinataPinResponse): PinResult {
  const cid = asCid(payload.IpfsHash);
  return {
    cid,
    uri: toIpfsUri(cid),
    size: Number(payload.PinSize),
  };
}

async function readPinataResponse(
  response: Response,
  failureMessage: string,
): Promise<PinataPinResponse> {
  if (!response.ok) {
    throw new IpfsPinError(failureMessage);
  }

  const payload = (await response.json()) as PinataPinResponse;
  if (!payload.IpfsHash) {
    throw new IpfsPinError(failureMessage);
  }

  return payload;
}

export function createPinataIpfsStorage(
  config: PinataIpfsStorageConfig,
): IpfsStoragePort {
  const fetchImpl = config.fetchImpl ?? fetch;
  const pinJsonUrl = config.pinJsonUrl ?? DEFAULT_PIN_JSON_URL;
  const pinFileUrl = config.pinFileUrl ?? DEFAULT_PIN_FILE_URL;

  return {
    async pinJson(data: unknown, options?: PinOptions): Promise<PinResult> {
      const response = await fetchImpl(pinJsonUrl, {
        method: "POST",
        headers: {
          ...buildAuthHeaders(config.apiKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: data,
          ...(options?.name
            ? { pinataMetadata: { name: options.name } }
            : {}),
        }),
      });

      const payload = await readPinataResponse(
        response,
        "Unable to pin metadata to IPFS",
      );
      return toPinResult(payload);
    },

    async pinBlob(data: Uint8Array, options?: PinOptions): Promise<PinResult> {
      const form = new FormData();
      form.append(
        "file",
        new Blob([Uint8Array.from(data)]),
        options?.name ?? "andromeda-blob.bin",
      );

      const response = await fetchImpl(pinFileUrl, {
        method: "POST",
        headers: buildAuthHeaders(config.apiKey),
        body: form,
      });

      const payload = await readPinataResponse(
        response,
        "Unable to pin content to IPFS",
      );
      return toPinResult(payload);
    },

    toGatewayUrl(cidOrUri) {
      return toGatewayUrl(cidOrUri, config.gatewayBaseUrl);
    },
  };
}

export function createPinataIpfsStorageFromEnv(
  config: Pick<PinataIpfsStorageConfig, "apiKey" | "gatewayBaseUrl"> &
    Partial<
      Pick<
        PinataIpfsStorageConfig,
        "fetchImpl" | "pinJsonUrl" | "pinFileUrl"
      >
    >,
): IpfsStoragePort {
  return createPinataIpfsStorage(config);
}
