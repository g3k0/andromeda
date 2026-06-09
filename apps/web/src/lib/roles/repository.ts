import type { CreateRoleInput, Role, UpdateRoleInput } from "./types";

export type RoleRepository = {
  list(): Promise<Role[]>;
  getBySlug(slug: string): Promise<Role | null>;
  exists(slug: string): Promise<boolean>;
  create(input: CreateRoleInput): Promise<Role>;
  update(slug: string, input: UpdateRoleInput): Promise<Role>;
  delete(slug: string): Promise<void>;
};
