import type { CreateUserInput, User, UserListFilter } from "./types";

export type UserRepository = {
  getByAddress(address: string): Promise<User | null>;
  exists(address: string): Promise<boolean>;
  create(input: CreateUserInput): Promise<User>;
  update(user: User): Promise<User>;
  delete(address: string): Promise<void>;
  list(filter?: UserListFilter): Promise<User[]>;
  countByRoleSlug(roleSlug: string): Promise<number>;
};
