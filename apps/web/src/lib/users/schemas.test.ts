import { describe, expect, it } from "vitest";
import {
  createUserBodySchema,
  updateUserBodySchema,
  userPermissionSchema,
} from "./schemas";

const ADDRESS = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01";

describe("user schemas", () => {
  it("parses create user payloads", () => {
    const parsed = createUserBodySchema.parse({
      address: ADDRESS,
      targetAddress: ADDRESS,
      message: "Sign in to Andromeda",
      signature: "0x01",
      roleSlug: "admin",
      permissionOverrides: ["admin:access"],
    });

    expect(parsed.targetAddress).toBe(ADDRESS.toLowerCase());
    expect(parsed.roleSlug).toBe("admin");
  });

  it("rejects unknown permissions", () => {
    expect(() =>
      createUserBodySchema.parse({
        address: ADDRESS,
        targetAddress: ADDRESS,
        message: "Sign in to Andromeda",
        signature: "0x01",
        permissionOverrides: ["unknown:permission"],
      }),
    ).toThrow();
  });

  it("allows partial update payloads", () => {
    const parsed = updateUserBodySchema.parse({
      address: ADDRESS,
      message: "Sign in to Andromeda",
      signature: "0x01",
      status: "suspended",
    });

    expect(parsed.status).toBe("suspended");
    expect(parsed.roleSlug).toBeUndefined();
  });

  it("validates permission enum values", () => {
    expect(userPermissionSchema.parse("pages:read")).toBe("pages:read");
    expect(() => userPermissionSchema.parse("invalid")).toThrow();
  });
});
