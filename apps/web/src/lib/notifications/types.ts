export type NotificationVariant = "info" | "success" | "warning" | "error";

export type Notification = {
  id: string;
  message: string;
  variant: NotificationVariant;
  durationMs: number;
};

export type NotifyInput = {
  message: string;
  variant?: NotificationVariant;
  durationMs?: number;
};
