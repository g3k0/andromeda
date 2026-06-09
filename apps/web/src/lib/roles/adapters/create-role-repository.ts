import { connectMongo } from "@/lib/db/mongodb";
import type { RoleRepository } from "../repository";
import { MongoRoleRepository } from "./mongo-role-repository";

export async function createMongoRoleRepository(): Promise<RoleRepository> {
  await connectMongo();
  return new MongoRoleRepository();
}
