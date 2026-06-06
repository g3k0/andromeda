import { describe, expect, it } from "vitest";
import { AUTHOR_COLLECTION_NAME, AuthorModel } from "./author.model";

describe("AuthorModel", () => {
  it("uses the authors collection explicitly", () => {
    expect(AUTHOR_COLLECTION_NAME).toBe("authors");
    expect(AuthorModel.collection.name).toBe("authors");
  });
});
