export class InvalidContentKeyError extends Error {
  constructor(message = "Invalid content key length") {
    super(message);
    this.name = "InvalidContentKeyError";
  }
}

export class InvalidCiphertextError extends Error {
  constructor(message = "Invalid or unsupported ciphertext format") {
    super(message);
    this.name = "InvalidCiphertextError";
  }
}

export class InvalidEnvelopeError extends Error {
  constructor(message = "Invalid or unsupported envelope format") {
    super(message);
    this.name = "InvalidEnvelopeError";
  }
}

export class ContentDecryptError extends Error {
  constructor(message = "Failed to decrypt content") {
    super(message);
    this.name = "ContentDecryptError";
  }
}

export class EnvelopeUnwrapError extends Error {
  constructor(message = "Failed to unwrap envelope") {
    super(message);
    this.name = "EnvelopeUnwrapError";
  }
}
