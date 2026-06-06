export class MongoDbUriMissingError extends Error {
  constructor() {
    super(
      "MONGODB_URI is not defined. Set it in .env.development.local or the deployment environment.",
    );
    this.name = "MongoDbUriMissingError";
  }
}
