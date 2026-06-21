export type UserNotification = {
  id: string;
  recipientId: string;
  actorId: string;
  type: "like" | "mention";
  resourceType: "post" | "comment";
  resourceId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export type NotificationPageParams = {
  limit: number;
  cursor?: string | null;
  unreadOnly?: boolean;
};

export type NotificationPage = {
  items: UserNotification[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type FetchNotificationPage = (
  params: NotificationPageParams
) => Promise<NotificationPage>;
