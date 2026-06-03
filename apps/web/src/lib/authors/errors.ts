export class InvalidAddressError extends Error {
  constructor(address: string) {
    super(`Invalid Ethereum address: ${address}`);
    this.name = "InvalidAddressError";
  }
}

export class AuthorProfileExistsError extends Error {
  constructor(address: string) {
    super(`Author profile already exists for ${address}`);
    this.name = "AuthorProfileExistsError";
  }
}

export class AuthorProfileNotFoundError extends Error {
  constructor(address: string) {
    super(`Author profile not found for ${address}`);
    this.name = "AuthorProfileNotFoundError";
  }
}
