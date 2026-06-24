"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteNotification as deleteNotificationApi,
  markAllNotificationsAsRead as markAllNotificationsAsReadApi,
  markNotificationAsRead as markNotificationAsReadApi,
} from "@/lib/api/notification.service";
import { getApiErrorMessage } from "@/lib/api/http-client";
import { useI18n } from "@/lib/i18n/client";
import { enrichNotificationsWithActors } from "@/lib/notifications/enrich-notifications";
import type {
  FetchNotificationPage,
  UserNotification,
} from "@/types/notification";

type UseNotificationListOptions = {
  fetchNotifications: FetchNotificationPage;
  recipientId: string;
  pageSize?: number;
};

export function useNotificationList({
  fetchNotifications,
  recipientId,
  pageSize = 20,
}: UseNotificationListOptions) {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      setIsLoading(true);
      setError(null);

      try {
        const page = await fetchNotifications({ limit: pageSize });
        const enrichedItems = await enrichNotificationsWithActors(page.items);
        if (isMounted) {
          setNotifications(enrichedItems);
          setNextCursor(page.nextCursor);
          setHasMore(page.hasMore);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            t("notifications.loadError", {
              message: getApiErrorMessage(loadError),
            })
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [fetchNotifications, pageSize, t]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await fetchNotifications({
        limit: pageSize,
        cursor: nextCursor,
      });
      const enrichedItems = await enrichNotificationsWithActors(page.items);

      setNotifications((currentNotifications) => {
        const currentIds = new Set(
          currentNotifications.map((notification) => notification.id)
        );
        const nextItems = enrichedItems.filter(
          (notification) => !currentIds.has(notification.id)
        );

        return [...currentNotifications, ...nextItems];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (loadMoreError) {
      setError(
        t("notifications.loadMoreError", {
          message: getApiErrorMessage(loadMoreError),
        })
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchNotifications, hasMore, isLoadingMore, nextCursor, pageSize, t]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const updated = await markNotificationAsReadApi(notificationId);

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...updated,
              actor: notification.actor ?? updated.actor,
              postId: notification.postId ?? updated.postId,
            }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsReadApi(recipientId);

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? new Date().toISOString(),
      }))
    );
  }, [recipientId]);

  const removeNotification = useCallback(async (notificationId: string) => {
    await deleteNotificationApi(notificationId);

    setNotifications((currentNotifications) =>
      currentNotifications.filter(
        (notification) => notification.id !== notificationId
      )
    );
  }, []);

  return {
    notifications,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
