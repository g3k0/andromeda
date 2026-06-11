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
