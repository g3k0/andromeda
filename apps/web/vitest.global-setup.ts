import { MongoMemoryServer } from "mongodb-memory-server";

export default async function globalSetup() {
  const memoryServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 120_000,
    },
  });

  await memoryServer.stop();
}
