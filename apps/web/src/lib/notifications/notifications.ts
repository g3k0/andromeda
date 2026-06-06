import type { Notification, NotifyInput } from "./types";

export const DEFAULT_NOTIFICATION_DURATION_MS = 4_000;

export function createNotification(
  input: NotifyInput,
  id = crypto.randomUUID(),
): Notification {
  return {
    id,
    message: input.message,
    variant: input.variant ?? "info",
    durationMs: input.durationMs ?? DEFAULT_NOTIFICATION_DURATION_MS,
  };
}

export function addNotification(
  notifications: readonly Notification[],
  input: NotifyInput,
): Notification[] {
  return [...notifications, createNotification(input)];
}

export function removeNotification(
  notifications: readonly Notification[],
  id: string,
): Notification[] {
  return notifications.filter((notification) => notification.id !== id);
}
