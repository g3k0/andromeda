import { describe, expect, it } from "vitest";
import {
  formatAdminUserCreatedAt,
  sortAdminRowsByCreatedAtDesc,
  syncAdminRowsFromUsers,
  truncateAddress,
  userToAdminRow,
  usersToAdminRows,
} from "./admin-users-mappers";
import type { User } from "./types";
import { defaultUserPreferences } from "./types";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

function buildUser(overrides: Partial<User> = {}): User {
  return {
    address: ADDRESS,
    role: "reader",
    status: "active",
    permissions: [],
    preferences: defaultUserPreferences(),
    metadata: {},
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("admin users mappers", () => {
  it("truncates long addresses for display", () => {
    expect(truncateAddress(ADDRESS)).toBe("0xabcdef…cdef01");
    expect(truncateAddress("0x1234")).toBe("0x1234");
  });

  it("formats createdAt as YYYY-MM-DD", () => {
    expect(formatAdminUserCreatedAt("2026-02-01T12:34:56.000Z")).toBe(
      "2026-02-01",
    );
  });

  it("maps users to admin rows and sorts by createdAt desc", () => {
    const rows = usersToAdminRows([
      buildUser({ createdAt: "2026-01-01T00:00:00.000Z" }),
      buildUser({
        address: "0x1111111111111111111111111111111111111111",
        role: "admin",
        createdAt: "2026-03-01T00:00:00.000Z",
      }),
    ]);

    expect(userToAdminRow(rows[0])).toEqual({
      address: ADDRESS,
      role: "reader",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(sortAdminRowsByCreatedAtDesc(rows).map((row) => row.createdAt)).toEqual(
      ["2026-03-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z"],
    );
  });

  it("syncs rows and editable drafts from domain users", () => {
    const synced = syncAdminRowsFromUsers([
      buildUser({ createdAt: "2026-02-01T00:00:00.000Z" }),
    ]);

    expect(synced.rows).toHaveLength(1);
    expect(synced.drafts[0]).toEqual(synced.rows[0]);
  });
});
