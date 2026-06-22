export type NotificationType = "like";

export type NotificationResourceType = "post" | "comment";

export type CreateNotificationInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  resourceType: NotificationResourceType;
  resourceId: string;
  postId?: string | null;
};

export type NotificationResponse = {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  resourceType: NotificationResourceType;
  resourceId: string;
  postId: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
};

export type NotificationListResponse = {
  notifications: NotificationResponse[];
  nextCursor: string | null;
  hasMore: boolean;
};
