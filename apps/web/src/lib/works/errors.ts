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
