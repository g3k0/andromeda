import { describe, expect, it } from "vitest";
import { parseAdminAddresses } from "@/lib/auth/admin";

describe("migrate-users script helpers", () => {
  it("parses admin addresses from a comma-separated env string", () => {
    expect(
      parseAdminAddresses(
        "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01, 0x1111111111111111111111111111111111111111",
      ),
    ).toEqual([
      "0xabcdef0123456789abcdef0123456789abcdef01",
      "0x1111111111111111111111111111111111111111",
    ]);
  });
});
