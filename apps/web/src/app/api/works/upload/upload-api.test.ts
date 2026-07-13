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
import { WorkUploadModel } from "@/lib/db/models/work-upload.model";
import { RateLimitBucketModel } from "@/lib/db/models/rate-limit-bucket.model";
import { RoleModel } from "@/lib/db/models/role.model";
import { UserModel } from "@/lib/db/models/user.model";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
} from "@/lib/ipfs/testing/in-memory-ipfs-storage";
import { resetAuthorServiceForTests } from "@/lib/authors/server";
import { resetServerEnvForTests } from "@/lib/config/env";
import { resetUserServiceForTests } from "@/lib/users/server";
import { resetRoleServiceForTests } from "@/lib/roles/server";
import { seedApiSystemRoles } from "@/lib/testing/seed-api-roles";
import { encryptContent, encodeUtf8Plaintext } from "@/lib/content-crypto/content-cipher";
import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import { MINIMAL_PNG_BYTES } from "@/lib/works/cover-image-validation";

import { POST } from "./route";
import { setIpfsStorageForTests } from "@/lib/works/ipfs-server";
import {
  resetWorkUploadServiceForTests,
} from "@/lib/works/work-upload-server";

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
  formData.set("backCoverText", "An encrypted novella about distant stars.");
  formData.set("aboutAuthor", "The author writes speculative fiction.");
  formData.set(
    "ciphertext",
    new Blob([Uint8Array.from(ciphertext)], { type: "application/octet-stream" }),
  );
  formData.set(
    "coverImage",
    new Blob([MINIMAL_PNG_BYTES], { type: "image/png" }),
  );

  for (const [key, value] of Object.entries(extra)) {
    formData.set(key, value);
  }

  return formData;
}

async function uploadRequest(
  formData: FormData,
  ip = "203.0.113.50",
): Promise<Response> {
  return POST(
    new Request("http://localhost/api/works/upload", {
      method: "POST",
      headers: {
        "x-forwarded-for": ip,
      },
      body: formData,
    }),
  );
}

describe("works upload API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS =
      "0x3333333333333333333333333333333333333333";
    resetMongoConnectionForTests();
    resetWorkUploadServiceForTests();
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
    resetWorkUploadServiceForTests();
    resetAuthorServiceForTests();
    resetUserServiceForTests();
    resetRoleServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
    await AuthorModel.deleteMany({});
    await WorkUploadModel.deleteMany({});
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
    const response = await uploadRequest(formData);

    expect(response.status).toBe(404);
  });

  it("pins encrypted work content and metadata for an authenticated author", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const formData = await signedUploadForm();
    const response = await uploadRequest(formData);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.metadataUri).toMatch(/^ipfs:\/\//);
    expect(json.metadata.ace.encrypted_content).toMatch(/^ipfs:\/\//);
    expect(json.metadata.name).toBe("The Star Gate");
    expect(json.metadata.work_imprint.publication_date).toBe("2026-06-01");
    expect(json.upload.author.toLowerCase()).toBe(AUTHOR_ADDRESS);
    expect(json.upload.metadataCid).toBe(json.metadataCid);

    const stored = await WorkUploadModel.find({ author: AUTHOR_ADDRESS }).lean();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.metadataCid).toBe(json.metadataCid);
  });

  it("rejects contentKey in the upload payload", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const formData = await signedUploadForm({ contentKey: "never" });
    const response = await uploadRequest(formData);

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.code).toBe("forbidden_content_key");
  });

  it("returns 422 when cover bytes do not match the declared MIME type", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const formData = await signedUploadForm();
    formData.set(
      "coverImage",
      new Blob([new Uint8Array([9, 8, 7])], { type: "image/png" }),
    );

    const response = await uploadRequest(formData);

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.code).toBe("work_upload_validation");
  });

  it("returns 403 when the author account is suspended", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });
    await UserModel.create({
      address: AUTHOR_ADDRESS,
      roleSlug: "author",
      status: "suspended",
      permissionOverrides: [],
      preferences: { declinedAuthorPage: false },
    });

    const formData = await signedUploadForm();
    const response = await uploadRequest(formData);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.code).toBe("user_suspended");
  });

  it("returns 409 when the same first edition is uploaded twice", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const first = await uploadRequest(await signedUploadForm());
    expect(first.status).toBe(201);

    const duplicate = await uploadRequest(await signedUploadForm());
    expect(duplicate.status).toBe(409);
    const json = await duplicate.json();
    expect(json.code).toBe("work_upload_duplicate");
  });

  it("allows a reprint upload for the same title", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const first = await uploadRequest(await signedUploadForm());
    expect(first.status).toBe(201);

    const reprint = await uploadRequest(
      await signedUploadForm({
        editionKind: "reprint",
        reprintNumber: "1",
      }),
    );
    expect(reprint.status).toBe(201);

    const stored = await WorkUploadModel.find({ author: AUTHOR_ADDRESS }).lean();
    expect(stored).toHaveLength(2);
  });

  it("returns 409 when the same reprint slot is uploaded twice", async () => {
    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const first = await uploadRequest(
      await signedUploadForm({
        editionKind: "reprint",
        reprintNumber: "1",
      }),
    );
    expect(first.status).toBe(201);

    const duplicate = await uploadRequest(
      await signedUploadForm({
        editionKind: "reprint",
        reprintNumber: "1",
      }),
    );
    expect(duplicate.status).toBe(409);
    const json = await duplicate.json();
    expect(json.code).toBe("work_upload_duplicate");
  });

  it("returns 429 when the per-author upload quota is exceeded", async () => {
    resetServerEnvForTests();
    process.env.TRUST_PROXY = "true";
    process.env.WORK_UPLOAD_WALLET_RATE_LIMIT_MAX_REQUESTS = "1";

    await AuthorModel.create({
      address: AUTHOR_ADDRESS,
      displayName: "Writer",
      avatarUrl: null,
    });

    const first = await uploadRequest(await signedUploadForm());
    expect(first.status).toBe(201);

    const limited = await uploadRequest(
      await signedUploadForm({
        name: "The Second Gate",
      }),
    );
    expect(limited.status).toBe(429);
    const json = await limited.json();
    expect(json.code).toBe("rate_limited");

    delete process.env.TRUST_PROXY;
    delete process.env.WORK_UPLOAD_WALLET_RATE_LIMIT_MAX_REQUESTS;
    resetServerEnvForTests();
  });
});
