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
      role: "admin",
      permissions: ["admin:access"],
    });

    expect(parsed.targetAddress).toBe(ADDRESS.toLowerCase());
    expect(parsed.role).toBe("admin");
  });

  it("rejects unknown permissions", () => {
    expect(() =>
      createUserBodySchema.parse({
        address: ADDRESS,
        targetAddress: ADDRESS,
        message: "Sign in to Andromeda",
        signature: "0x01",
        permissions: ["unknown:permission"],
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
    expect(parsed.role).toBeUndefined();
  });

  it("validates permission enum values", () => {
    expect(userPermissionSchema.parse("pages:read")).toBe("pages:read");
    expect(() => userPermissionSchema.parse("invalid")).toThrow();
  });
});
