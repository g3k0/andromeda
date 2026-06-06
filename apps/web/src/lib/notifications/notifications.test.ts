import { describe, expect, it } from "vitest";
import {
  addNotification,
  createNotification,
  DEFAULT_NOTIFICATION_DURATION_MS,
  removeNotification,
} from "./notifications";

describe("notifications", () => {
  it("creates a notification with defaults", () => {
    expect(
      createNotification({ message: "Hello" }, "test-id"),
    ).toEqual({
      id: "test-id",
      message: "Hello",
      variant: "info",
      durationMs: DEFAULT_NOTIFICATION_DURATION_MS,
    });
  });

  it("adds and removes notifications immutably", () => {
    const first = addNotification([], { message: "One", variant: "success" });
    const second = addNotification(first, {
      message: "Two",
      variant: "warning",
    });

    expect(second).toHaveLength(2);
    expect(second[0]?.message).toBe("One");
    expect(second[1]?.variant).toBe("warning");

    const remaining = removeNotification(second, second[0]!.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.message).toBe("Two");
  });
});
