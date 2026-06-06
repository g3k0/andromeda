import mongoose from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoDbUriMissingError } from "./errors";
import {
  connectMongo,
  getMongoDbUri,
  resetMongoConnectionForTests,
} from "./mongodb";

vi.mock("mongoose", () => ({
  default: {
    connect: vi.fn(),
  },
}));

const mockedConnect = vi.mocked(mongoose.connect);

describe("getMongoDbUri", () => {
  const previous = process.env.MONGODB_URI;

  afterEach(() => {
    process.env.MONGODB_URI = previous;
  });

  it("returns the configured URI at call time", () => {
    process.env.MONGODB_URI = "mongodb://example.test/andromeda";
    expect(getMongoDbUri()).toBe("mongodb://example.test/andromeda");
  });

  it("returns undefined when MONGODB_URI is unset", () => {
    delete process.env.MONGODB_URI;
    expect(getMongoDbUri()).toBeUndefined();
  });
});

describe("connectMongo", () => {
  const previous = process.env.MONGODB_URI;

  beforeEach(() => {
    resetMongoConnectionForTests();
    mockedConnect.mockReset();
    mockedConnect.mockResolvedValue(mongoose);
    process.env.MONGODB_URI = "mongodb://example.test/andromeda";
  });

  afterEach(() => {
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = previous;
  });

  it("throws MongoDbUriMissingError when MONGODB_URI is unset", async () => {
    delete process.env.MONGODB_URI;

    await expect(connectMongo()).rejects.toBeInstanceOf(MongoDbUriMissingError);
    expect(mockedConnect).not.toHaveBeenCalled();
  });

  it("connects with MONGODB_URI and returns mongoose", async () => {
    const connection = await connectMongo();

    expect(connection).toBe(mongoose);
    expect(mockedConnect).toHaveBeenCalledWith("mongodb://example.test/andromeda");
    expect(mockedConnect).toHaveBeenCalledTimes(1);
  });

  it("reuses the cached connection on subsequent calls", async () => {
    await connectMongo();
    await connectMongo();

    expect(mockedConnect).toHaveBeenCalledTimes(1);
  });

  it("reuses an in-flight connection promise", async () => {
    let resolveConnect: (value: typeof mongoose) => void = () => {};
    const pending = new Promise<typeof mongoose>((resolve) => {
      resolveConnect = resolve;
    });
    mockedConnect.mockReturnValue(pending);

    const first = connectMongo();
    const second = connectMongo();

    resolveConnect(mongoose);
    await expect(Promise.all([first, second])).resolves.toEqual([
      mongoose,
      mongoose,
    ]);
    expect(mockedConnect).toHaveBeenCalledTimes(1);
  });
});
