import { connectMongo } from "@/lib/db/mongodb";

import type { WorkUploadRepository } from "../ports/work-upload-repository";
import { MongoWorkUploadRepository } from "./mongo-work-upload-repository";

export async function createMongoWorkUploadRepository(): Promise<WorkUploadRepository> {
  await connectMongo();
  return new MongoWorkUploadRepository();
}
