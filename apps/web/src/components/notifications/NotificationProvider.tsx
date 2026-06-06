"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addNotification,
  removeNotification,
} from "@/lib/notifications/notifications";
import type { Notification, NotifyInput } from "@/lib/notifications/types";
import { NotificationViewport } from "./NotificationViewport";

type NotificationContextValue = {
  notify: (input: NotifyInput) => string;
  dismiss: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => removeNotification(current, id));
  }, []);

  const notify = useCallback((input: NotifyInput) => {
    let createdId = "";
    setNotifications((current) => {
      const next = addNotification(current, input);
      createdId = next[next.length - 1]!.id;
      return next;
    });
    return createdId;
  }, []);

  const value = useMemo(
    () => ({
      notify,
      dismiss,
    }),
    [notify, dismiss],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationViewport
        notifications={notifications}
        onDismiss={dismiss}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider.");
  }
  return context;
}
