export class WalletSignatureInvalidError extends Error {
  constructor() {
    super("Wallet signature is invalid.");
    this.name = "WalletSignatureInvalidError";
  }
}

export class WalletAuthExpiredError extends Error {
  constructor() {
    super("Wallet authentication message has expired.");
    this.name = "WalletAuthExpiredError";
  }
}

export class WalletAuthReplayError extends Error {
  constructor() {
    super("Wallet authentication nonce was already used.");
    this.name = "WalletAuthReplayError";
  }
}

export class WalletAuthMessageInvalidError extends Error {
  constructor() {
    super("Wallet authentication message is invalid.");
    this.name = "WalletAuthMessageInvalidError";
  }
}

export class WalletAuthorizationError extends Error {
  constructor(message = "Wallet is not authorized for this action.") {
    super(message);
    this.name = "WalletAuthorizationError";
  }
}
