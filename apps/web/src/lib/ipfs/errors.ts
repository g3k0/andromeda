export class IpfsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IpfsConfigError";
  }
}

export class IpfsPinError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IpfsPinError";
  }
}

/** Upload / fetch failures against Arweave (Turbo or gateway). */
export class ArweaveUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArweaveUploadError";
  }
}

export class IpfsMetadataValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: readonly string[],
  ) {
    super(message);
    this.name = "IpfsMetadataValidationError";
  }
}
