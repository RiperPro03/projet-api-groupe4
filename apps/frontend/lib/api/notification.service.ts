import { httpClient } from "./http-client";
import { fetchProfilesByUserIds } from "./profile.service";
import type {
  FetchNotificationPage,
  NotificationPage,
  NotificationPageParams,
  UserNotification,
} from "@/types/notification";

type ApiNotification = {
  id: string;
  recipientId: string;
  actorId: string;
  type: "like";
  resourceType: "post" | "comment";
  resourceId: string;
  postId?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

type NotificationsListResponse = {
  status: string;
  data: {
    notifications: ApiNotification[];
    nextCursor?: string | null;
    hasMore?: boolean;
  };
};

type NotificationResponse = {
  status: string;
  data: {
    notification: ApiNotification;
  };
};

type UnreadCountResponse = {
  status: string;
  data: {
    count: number;
  };
};

type MarkAllReadResponse = {
  status: string;
  data: {
    updatedCount: number;
  };
};

function mapApiNotification(notification: ApiNotification): UserNotification {
  return {
    id: notification.id,
    recipientId: notification.recipientId,
    actorId: notification.actorId,
    type: notification.type,
    resourceType: notification.resourceType,
    resourceId: notification.resourceId,
    postId: notification.postId ?? null,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
  };
}

async function enrichNotificationsWithActorNames(
  notifications: UserNotification[]
): Promise<UserNotification[]> {
  if (notifications.length === 0) {
    return notifications;
  }

  const profiles = await fetchProfilesByUserIds(
    notifications.map((notification) => notification.actorId)
  );

  return notifications.map((notification) => ({
    ...notification,
    actorName: profiles.get(notification.actorId)?.name,
  }));
}

function fallbackPage(
  items: UserNotification[],
  params: NotificationPageParams
): NotificationPage {
  return {
    items,
    nextCursor: items.at(-1)?.id ?? null,
    hasMore: items.length === params.limit,
  };
}

export function fetchUserNotifications(
  recipientId: string
): FetchNotificationPage {
  return async (params) => {
    const { data } = await httpClient.get<NotificationsListResponse>(
      "/notifications/notifications",
      {
        params: {
          recipientId,
          limit: params.limit,
          cursor: params.cursor,
          unreadOnly: params.unreadOnly ? "true" : undefined,
        },
      }
    );

    const items = await enrichNotificationsWithActorNames(
      data.data.notifications.map(mapApiNotification)
    );

    return {
      items,
      nextCursor:
        data.data.nextCursor ?? fallbackPage(items, params).nextCursor,
      hasMore: data.data.hasMore ?? fallbackPage(items, params).hasMore,
    };
  };
}

export async function getUnreadCount(recipientId: string) {
  const { data } = await httpClient.get<UnreadCountResponse>(
    "/notifications/notifications/unread-count",
    {
      params: { recipientId },
    }
  );

  return data.data.count;
}

export async function markNotificationAsRead(notificationId: string) {
  const { data } = await httpClient.patch<NotificationResponse>(
    `/notifications/notifications/${notificationId}/read`
  );

  const [notification] = await enrichNotificationsWithActorNames([
    mapApiNotification(data.data.notification),
  ]);

  return notification;
}

export async function markAllNotificationsAsRead(recipientId: string) {
  const { data } = await httpClient.patch<MarkAllReadResponse>(
    "/notifications/notifications/read-all",
    { recipientId }
  );

  return data.data.updatedCount;
}

export async function deleteNotification(notificationId: string) {
  await httpClient.delete(`/notifications/notifications/${notificationId}`);
}
