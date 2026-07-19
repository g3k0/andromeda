import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import { resetServerEnvForTests } from "@/lib/config/env";
import { computeAlchemySignature } from "@/lib/indexer/webhook-signature";
import { TokenModel } from "@/lib/db/models/token.model";
import { WorkModel } from "@/lib/db/models/work.model";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";

import { POST } from "./route";

const SIGNING_KEY = "whsec_integration_key";
const CONTRACT = "0x1111111111111111111111111111111111111111";
const AUTHOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const BUYER = "0x2222222222222222222222222222222222222222" as const;

function workRegisteredLog(workId: bigint, index: number) {
  return {
    account: { address: CONTRACT },
    topics: encodeEventTopics({
      abi: andromedaWorksAbi,
      eventName: "WorkRegistered",
      args: { workId, author: AUTHOR },
    }),
    data: encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }, { type: "uint256" }],
      ["ipfs://meta", 1000n, 10n],
    ),
    index,
  };
}

function copyMintedLog(
  workId: bigint,
  tokenId: bigint,
  index: number,
) {
  return {
    account: { address: CONTRACT },
    topics: encodeEventTopics({
      abi: andromedaWorksAbi,
      eventName: "CopyMinted",
      args: { workId, tokenId, recipient: BUYER },
    }),
    data: encodeAbiParameters([{ type: "uint256" }], [1n]),
    index,
  };
}

function buildBody(logs: unknown[]): string {
  return JSON.stringify({
    webhookId: "wh_test",
    event: { data: { block: { number: 42, logs } } },
  });
}

function signedRequest(body: string): Request {
  return new Request("http://localhost/api/chain/webhook", {
    method: "POST",
    headers: { "x-alchemy-signature": computeAlchemySignature(body, SIGNING_KEY) },
    body,
  });
}

describe("chain webhook API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    process.env.ALCHEMY_NOTIFY_SIGNING_KEY = SIGNING_KEY;
    resetServerEnvForTests();
    resetMongoConnectionForTests();
    await connectMongo();
  }, 120_000);

  afterEach(async () => {
    await WorkModel.deleteMany({});
    await TokenModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    resetServerEnvForTests();
    delete process.env.ALCHEMY_NOTIFY_SIGNING_KEY;
    await memoryServer?.stop();
  });

  it("rejects requests without a valid signature", async () => {
    const body = buildBody([workRegisteredLog(1n, 0)]);
    const response = await POST(
      new Request("http://localhost/api/chain/webhook", {
        method: "POST",
        headers: { "x-alchemy-signature": "deadbeef" },
        body,
      }),
    );
    expect(response.status).toBe(401);
  });

  it("indexes events from a signed payload", async () => {
    const body = buildBody([workRegisteredLog(1n, 0)]);
    const response = await POST(signedRequest(body));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.processed).toBe(1);

    const work = await WorkModel.findOne({ workId: "1" });
    expect(work?.metadataURI).toBe("ipfs://meta");
  });

  it("is idempotent across duplicate deliveries", async () => {
    const body = buildBody([
      workRegisteredLog(1n, 0),
      copyMintedLog(1n, 1n, 1),
    ]);

    await POST(signedRequest(body));
    await POST(signedRequest(body));

    const tokens = await TokenModel.find({ workId: "1" });
    expect(tokens).toHaveLength(1);

    const work = await WorkModel.findOne({ workId: "1" });
    expect(work?.minted).toBe("1");
  });
});
