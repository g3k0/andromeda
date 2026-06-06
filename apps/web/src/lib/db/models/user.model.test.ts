import { describe, expect, it } from "vitest";
import { USER_COLLECTION_NAME } from "./user.model";

describe("UserModel", () => {
  it("uses the users collection name", () => {
    expect(USER_COLLECTION_NAME).toBe("users");
  });
});
