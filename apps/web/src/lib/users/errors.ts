export class UserNotFoundError extends Error {
  constructor(address: string) {
    super(`User not found for ${address}`);
    this.name = "UserNotFoundError";
  }
}

export class UserExistsError extends Error {
  constructor(address: string) {
    super(`User already exists for ${address}`);
    this.name = "UserExistsError";
  }
}

export class UserSuspendedError extends Error {
  constructor(address: string) {
    super(`User is suspended: ${address}`);
    this.name = "UserSuspendedError";
  }
}

export class InvalidUserRoleError extends Error {
  constructor(role: string) {
    super(`Invalid user role: ${role}`);
    this.name = "InvalidUserRoleError";
  }
}
