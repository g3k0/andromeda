import type {
  TurboDataItemTag,
  TurboUploadClient,
  TurboUploadParams,
} from "../ports/turbo-upload-client";

export type FakeTurboUploadRecord = {
  id: string;
  data: Uint8Array | string;
  tags: TurboDataItemTag[] | undefined;
};

export type FakeTurboUploadState = {
  uploads: FakeTurboUploadRecord[];
  nextId: number;
  failNext?: boolean;
};

export function createFakeTurboUploadState(
  seed?: Partial<FakeTurboUploadState>,
): FakeTurboUploadState {
  return {
    uploads: [],
    nextId: 1,
    ...seed,
  };
}

/** Deterministic Turbo client for unit tests (no network / SDK). */
export function createFakeTurboUploadClient(
  state: FakeTurboUploadState = createFakeTurboUploadState(),
): TurboUploadClient {
  return {
    async upload(params: TurboUploadParams): Promise<{ id: string }> {
      if (state.failNext) {
        state.failNext = false;
        throw new Error("simulated turbo failure");
      }
      const id = `fakeTx${state.nextId}`;
      state.nextId += 1;
      state.uploads.push({
        id,
        data: params.data,
        tags: params.dataItemOpts?.tags,
      });
      return { id };
    },
  };
}
