import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createWalletAuthMessage } from "@/lib/auth/verify-wallet";
import {
  resetRateLimitsForTests,
  useInMemoryRateLimitsForTests,
} from "@/lib/auth/rate-limit";
import {
  resetWalletAuthStoreForTests,
  useInMemoryWalletAuthStoreForTests,
} from "@/lib/auth/verify-wallet";
import { AuthorModel } from "@/lib/db/models/author.model";
import { RateLimitBucketModel } from "@/lib/db/models/rate-limit-bucket.model";
import { RoleModel } from "@/lib/db/models/role.model";
import { UserModel } from "@/lib/db/models/user.model";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
} from "@/lib/ipfs/testing/in-memory-ipfs-storage";
import { resetAuthorServiceForTests } from "@/lib/authors/server";
import { resetUserServiceForTests } from "@/lib/users/server";
import { resetRoleServiceForTests } from "@/lib/roles/server";
import { seedApiSystemRoles } from "@/lib/testing/seed-api-roles";
import { encryptContent, encodeUtf8Plaintext } from "@/lib/content-crypto/content-cipher";
import { generateContentKey } from "@/lib/content-crypto/ace-spec";

import { POST } from "./route";
import { setIpfsStorageForTests } from "@/lib/works/ipfs-server";

const AUTHOR = privateKeyToAccount(generatePrivateKey());
const AUTHOR_ADDRESS = AUTHOR.address.toLowerCase();

async function signedUploadForm(extra: Record<string, string | Blob> = {}) {
  const { message } = await createWalletAuthMessage(AUTHOR.address);
  const signature = await AUTHOR.signMessage({ message });
  const contentKey = generateContentKey();
  const ciphertext = await encryptContent(
    encodeUtf8Plaintext("Chapter one."),
    contentKey,
  );

  const formData = new FormData();
  formData.set(
    "walletAuth",
    JSON.stringify({
      address: AUTHOR.address,
      message,
      signature,
    }),
  );
  formData.set("name", "The Star Gate");
  formData.set("authorAddress", AUTHOR.address);
  formData.set("publicationDate", "2026-06-01");
  formData.set("editionNumber", "1");
  formData.set("editionKind", "first");
  formData.set("reprintNumber", "");
  formData.set("seriesName", "");
  formData.set("seriesVolume", "");
  formData.set("language", "");
  formData.set("originalPublicationDate", "");
  formData.set(
    "ciphertext",
    new Blob([Uint8Array.from(ciphertext)], { type: "application/octet-stream" }),
  );
  formData.set(
    "coverImage",
    new Blob([new Uint8Array([9, 8, 7])], { type: "image/png" }),
  );

  for (const [key, value] of Object.entries(extra)) {
    formData.set(key, value);
  }

  return formData;
}

describe("works upload API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS =
      "0x3333333333333333333333333333333333333333";
    resetMongoConnectionForTests();
    resetAuthorServiceForTests();
    resetUserServiceForTests();
    await seedApiSystemRoles();
  }, 120_000);

  beforeEach(async () => {
    resetRateLimitsForTests();
    useInMemoryRateLimitsForTests();
    useInMemoryWalletAuthStoreForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
    setIpfsStorageForTests(createInMemoryIpfsStorage(createInMemoryIpfsState()));
  });

  afterEach(async () => {
    resetWalletAuthStoreForTests();
    resetRateLimitsForTests();
    useInMemoryRateLimitsForTests();
    setIpfsStorageForTests(null);
    resetAuthorServiceForTests();
    resetUserServiceForTests();
    resetRoleServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
    await AuthorModel.deleteMany({});
    await UserModel.deleteMany({});
    await RoleModel.deleteMany({});
    await RateLimitBucketModel.deleteMany({});
    await seedApiSystemRoles();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("returns 404 when author profile is missing", async () => {
    const formData = await signedUploadForm();
    const response = await POST(
      new Request("http://localhost/api/works/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(404);
  });

  it("pins encrypted work content and metadata for an authenticated author", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const formData = await signedUploadForm();
    const response = await POST(
      new Request("http://localhost/api/works/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.metadataUri).toMatch(/^ipfs:\/\//);
    expect(json.metadata.ace.encrypted_content).toMatch(/^ipfs:\/\//);
    expect(json.metadata.name).toBe("The Star Gate");
    expect(json.metadata.work_imprint.publication_date).toBe("2026-06-01");
  });

  it("rejects contentKey in the upload payload", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const formData = await signedUploadForm({ contentKey: "never" });
    const response = await POST(
      new Request("http://localhost/api/works/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toMatch(/content keys/i);
  });
});
