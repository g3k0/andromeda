export class RoleNotFoundError extends Error {
  constructor(public readonly slug: string) {
    super(`Role not found: ${slug}.`);
    this.name = "RoleNotFoundError";
  }
}

export class RoleExistsError extends Error {
  constructor(public readonly slug: string) {
    super(`Role already exists: ${slug}.`);
    this.name = "RoleExistsError";
  }
}

export class InvalidRoleSlugError extends Error {
  constructor(public readonly slug: string) {
    super(`Invalid role slug: ${slug}.`);
    this.name = "InvalidRoleSlugError";
  }
}

export class InvalidRolePermissionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRolePermissionsError";
  }
}

export class SystemRoleMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SystemRoleMutationError";
  }
}

export class RoleInUseError extends Error {
  constructor(public readonly slug: string, public readonly userCount: number) {
    super(`Role ${slug} is assigned to ${userCount} user(s).`);
    this.name = "RoleInUseError";
  }
}

export class AdminRoleLockoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminRoleLockoutError";
  }
}
