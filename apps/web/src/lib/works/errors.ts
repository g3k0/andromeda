export class WorkPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkPublishError";
  }
}

export class ForbiddenContentKeyError extends WorkPublishError {
  constructor() {
    super("Content keys must never be sent to the server.");
    this.name = "ForbiddenContentKeyError";
  }
}

export class WorkUploadValidationError extends WorkPublishError {
  constructor(
    message: string,
    public readonly issues: readonly string[] = [],
  ) {
    super(message);
    this.name = "WorkUploadValidationError";
  }
}

export class WorkCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkCatalogError";
  }
}

export class InvalidWorkIdParamError extends WorkCatalogError {
  constructor(public readonly value: string) {
    super(`Invalid work id: ${value}`);
    this.name = "InvalidWorkIdParamError";
  }
}

export class InvalidOwnerAddressError extends WorkCatalogError {
  constructor(public readonly value: string) {
    super(`Invalid owner address: ${value}`);
    this.name = "InvalidOwnerAddressError";
  }
}

export class WorkMintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkMintError";
  }
}

export class MintEnvelopeError extends WorkMintError {
  constructor(message: string) {
    super(message);
    this.name = "MintEnvelopeError";
  }
}

export class WorkUploadMetadataExistsError extends WorkPublishError {
  constructor(public readonly metadataCid: string) {
    super("Work upload metadata already exists.");
    this.name = "WorkUploadMetadataExistsError";
  }
}
