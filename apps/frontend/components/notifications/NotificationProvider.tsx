"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  NotificationList,
  type AppNotification,
  type NotificationTone,
} from "@/components/notifications/NotificationList";

type NotifyOptions = {
  duration?: number | null;
};

type NotifyInput = {
  title: string;
  description: string;
  tone: NotificationTone;
};

type NotificationContextValue = {
  notify: (notification: NotifyInput, options?: NotifyOptions) => string;
  clearNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

function createNotification({
  tone,
  title,
  description,
}: NotifyInput): AppNotification {
  return {
    id: `${tone}-${Date.now()}-${crypto.randomUUID()}`,
    title,
    description,
    tone,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [autoCloseDelay, setAutoCloseDelay] = useState<number | null>(null);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setAutoCloseDelay(null);
  }, []);

  const notify = useCallback(
    (notification: NotifyInput, options?: NotifyOptions) => {
      const nextNotification = createNotification(notification);

      setNotifications([nextNotification]);
      setAutoCloseDelay(options?.duration === undefined ? 4000 : options.duration);

      return nextNotification.id;
    },
    [],
  );

  useEffect(() => {
    if (autoCloseDelay === null || notifications.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearNotifications();
    }, autoCloseDelay);

    return () => window.clearTimeout(timeout);
  }, [autoCloseDelay, clearNotifications, notifications.length]);

  const contextValue = useMemo(
    () => ({
      notify,
      clearNotifications,
    }),
    [clearNotifications, notify],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationList notifications={notifications} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  }

  return context;
}
