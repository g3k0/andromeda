export class AlchemyRpcUrlMissingError extends Error {
  constructor(scope: "server" | "client") {
    super(
      scope === "server"
        ? "ALCHEMY_RPC_URL is not configured"
        : "NEXT_PUBLIC_ALCHEMY_RPC_URL is not configured",
    );
    this.name = "AlchemyRpcUrlMissingError";
  }
}

export class WorkNotFoundError extends Error {
  constructor(public readonly workId: bigint) {
    super(`Work not found for id ${workId.toString()}`);
    this.name = "WorkNotFoundError";
  }
}

export class TokenNotFoundError extends Error {
  constructor(public readonly tokenId: bigint) {
    super(`Token not found for id ${tokenId.toString()}`);
    this.name = "TokenNotFoundError";
  }
}

export class InvalidWorkIdError extends Error {
  constructor(
    public readonly workId: bigint,
    public readonly totalWorks: bigint,
  ) {
    super(
      `Invalid work id ${workId.toString()} (total works: ${totalWorks.toString()})`,
    );
    this.name = "InvalidWorkIdError";
  }
}
