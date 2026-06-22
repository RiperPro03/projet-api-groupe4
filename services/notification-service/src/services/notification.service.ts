import { Notification } from "../models/notification.model.js";
import type {
  CreateNotificationInput,
  NotificationListResponse,
  NotificationResourceType,
  NotificationResponse,
  NotificationType,
} from "../types/notification.types.js";

export class NotificationError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "NotificationError";
  }
}

const RESOURCE_TYPES = new Set<NotificationResourceType>(["post", "comment"]);

function requireNonEmpty(value: string | undefined | null, fieldName: string) {
  const resolvedValue = typeof value === "string" ? value.trim() : "";

  if (!resolvedValue) {
    throw new NotificationError(`${fieldName} est requis`, 400);
  }

  return resolvedValue;
}

function buildMessage(
  type: NotificationType,
  resourceType: NotificationResourceType
): string {
  if (type === "like") {
    if (resourceType === "post") {
      return "Un utilisateur a aimé votre post";
    }

    return "Un utilisateur a aimé votre commentaire";
  }

  if (resourceType === "post") {
    return "Un utilisateur vous a mentionné dans un post";
  }

  return "Un utilisateur vous a mentionné dans un commentaire";
}

function mapNotification(notification: {
  _id: unknown;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  resourceType: NotificationResourceType;
  resourceId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date | null;
}): NotificationResponse {
  return {
    id: String(notification._id),
    recipientId: notification.recipientId,
    actorId: notification.actorId,
    type: notification.type,
    resourceType: notification.resourceType,
    resourceId: notification.resourceId,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    readAt: notification.readAt ?? null,
  };
}

function validateCreateInput(input: CreateNotificationInput) {
  const recipientId = requireNonEmpty(input.recipientId, "recipientId");
  const actorId = requireNonEmpty(input.actorId, "actorId");
  const type = requireNonEmpty(input.type, "type") as NotificationType;
  const resourceType = requireNonEmpty(
    input.resourceType,
    "resourceType"
  ) as NotificationResourceType;
  const resourceId = requireNonEmpty(input.resourceId, "resourceId");

  if (type !== "like" && type !== "mention") {
    throw new NotificationError("type doit être like ou mention", 400);
  }

  if (!RESOURCE_TYPES.has(resourceType)) {
    throw new NotificationError(
      "resourceType doit être post ou comment",
      400
    );
  }

  if (recipientId === actorId) {
    throw new NotificationError(
      "recipientId et actorId ne peuvent pas être identiques",
      400
    );
  }

  return {
    recipientId,
    actorId,
    type,
    resourceType,
    resourceId,
  };
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationResponse> {
  const validatedInput = validateCreateInput(input);

  const notification = await Notification.create({
    ...validatedInput,
    message: buildMessage(validatedInput.type, validatedInput.resourceType),
    isRead: false,
    readAt: null,
  });

  return mapNotification(notification);
}

export async function listNotifications(
  recipientId: string,
  options: {
    limit?: number;
    cursor?: string | null;
    unreadOnly?: boolean;
  } = {}
): Promise<NotificationListResponse> {
  const resolvedRecipientId = requireNonEmpty(recipientId, "recipientId");
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const query: Record<string, unknown> = {
    recipientId: resolvedRecipientId,
  };

  if (options.unreadOnly) {
    query.isRead = false;
  }

  if (options.cursor) {
    query._id = { $lt: options.cursor };
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = notifications.length > limit;
  const page = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor =
    hasMore && page.length > 0 ? String(page[page.length - 1]._id) : null;

  return {
    notifications: page.map((notification) => mapNotification(notification)),
    nextCursor,
    hasMore,
  };
}

export async function countUnreadNotifications(
  recipientId: string
): Promise<number> {
  const resolvedRecipientId = requireNonEmpty(recipientId, "recipientId");

  return Notification.countDocuments({
    recipientId: resolvedRecipientId,
    isRead: false,
  });
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationResponse> {
  const resolvedNotificationId = requireNonEmpty(
    notificationId,
    "notificationId"
  );

  const notification = await Notification.findByIdAndUpdate(
    resolvedNotificationId,
    {
      isRead: true,
      readAt: new Date(),
    },
    { new: true }
  ).lean();

  if (!notification) {
    throw new NotificationError("Notification introuvable", 404);
  }

  return mapNotification(notification);
}

export async function markAllNotificationsAsRead(
  recipientId: string
): Promise<number> {
  const resolvedRecipientId = requireNonEmpty(recipientId, "recipientId");
  const result = await Notification.updateMany(
    {
      recipientId: resolvedRecipientId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return result.modifiedCount;
}

export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const resolvedNotificationId = requireNonEmpty(
    notificationId,
    "notificationId"
  );

  const deleted = await Notification.findByIdAndDelete(resolvedNotificationId);

  if (!deleted) {
    throw new NotificationError("Notification introuvable", 404);
  }
}
