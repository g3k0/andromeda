/**
 * Minimal Turbo upload surface used by the Arweave permanent-storage adapter.
 * Production uses arbundles + Turbo HTTP; tests inject a fake client.
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
  upload(params: TurboUploadParams): Promise<{ id: string; winc?: string }>;
};
