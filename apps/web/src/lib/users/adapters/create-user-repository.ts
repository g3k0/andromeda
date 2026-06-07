import { connectMongo } from "@/lib/db/mongodb";
import type { UserRepository } from "../repository";
import { MongoUserRepository } from "./mongo-user-repository";

export async function createMongoUserRepository(): Promise<UserRepository> {
  await connectMongo();
  return new MongoUserRepository();
}
