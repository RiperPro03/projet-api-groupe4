"use client";

import { Alert, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import InboxNotificationItem from "@/components/notifications/InboxNotificationItem";
import { AnimatedList } from "@/components/ui/animated-list";
import { useNotificationList } from "@/hooks/useNotificationList";
import type { FetchNotificationPage } from "@/types/notification";

type InboxNotificationListProps = {
  fetchNotifications: FetchNotificationPage;
  recipientId: string;
  pageSize?: number;
};

export default function InboxNotificationList({
  fetchNotifications,
  recipientId,
  pageSize = 20,
}: InboxNotificationListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const {
    notifications,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationList({
    fetchNotifications,
    recipientId,
    pageSize,
  });

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  async function handleMarkAllAsRead() {
    if (isMarkingAll) {
      return;
    }

    setIsMarkingAll(true);

    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  }

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="green" />
      </Group>
    );
  }

  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={700} style={{ color: "var(--foreground)" }} size="lg">
          Notifications
        </Text>
        {hasUnread && (
          <Button
            variant="light"
            color="green"
            radius="xl"
            size="xs"
            loading={isMarkingAll}
            onClick={handleMarkAllAsRead}
          >
            Tout marquer comme lu
          </Button>
        )}
      </Group>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Text style={{ color: "var(--muted-foreground)" }} ta="center" py="xl">
          Aucune notification pour le moment.
        </Text>
      ) : (
        <AnimatedList delay={0} reverseOrder={false} className="gap-3">
          {notifications.map((notification) => (
            <InboxNotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={removeNotification}
            />
          ))}
        </AnimatedList>
      )}

      <div ref={loadMoreRef} aria-hidden="true" />

      {isLoadingMore && (
        <Group justify="center" py="md">
          <Loader color="green" size="sm" />
        </Group>
      )}

      {!hasMore && notifications.length > 0 && (
        <Text
          style={{ color: "var(--muted-foreground)" }}
          ta="center"
          size="sm"
          py="sm"
        >
          Vous avez atteint la fin des notifications.
        </Text>
      )}
    </Stack>
  );
}
