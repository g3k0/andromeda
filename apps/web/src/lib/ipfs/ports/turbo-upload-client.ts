/**
 * Minimal Turbo upload surface used by the Arweave permanent-storage adapter.
 * Keeps domain/adapter tests free of the real `@ardrive/turbo-sdk` dependency.
 */
export type TurboDataItemTag = {
  name: string;
  value: string;
};

export type TurboUploadParams = {
  data: Uint8Array | string;
  dataItemOpts?: {
    tags?: TurboDataItemTag[];
  };
};

export type TurboUploadClient = {
  upload(params: TurboUploadParams): Promise<{ id: string }>;
};
