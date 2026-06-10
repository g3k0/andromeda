"use client";

import { useEffect } from "react";
import type { Notification } from "@/lib/notifications/types";

const VARIANT_STYLES: Record<Notification["variant"], string> = {
  info: "border-andromeda-light/40 bg-andromeda/30",
  success: "border-emerald-400/40 bg-emerald-950/80",
  warning: "border-amber-400/40 bg-amber-950/80",
  error: "border-rose-400/40 bg-rose-950/80",
};

type NotificationViewportProps = {
  notifications: readonly Notification[];
  onDismiss: (id: string) => void;
};

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDismiss(notification.id);
    }, notification.durationMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [notification.durationMs, notification.id, onDismiss]);

  return (
    <output
      aria-live="polite"
      className={`block rounded-lg border px-4 py-3 text-sm text-white shadow-lg ${VARIANT_STYLES[notification.variant]}`}
    >
      {notification.message}
    </output>
  );
}

export function NotificationViewport({
  notifications,
  onDismiss,
}: NotificationViewportProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
