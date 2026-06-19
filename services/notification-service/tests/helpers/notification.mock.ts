import type {
  CreateNotificationInput,
  NotificationResponse,
} from "../../src/types/notification.types.js";

export function createLikeNotificationInput(
  overrides: Partial<CreateNotificationInput> = {}
): CreateNotificationInput {
  return {
    recipientId: "user-b",
    actorId: "user-a",
    type: "like",
    resourceType: "post",
    resourceId: "post-123",
    ...overrides,
  };
}

export function createNotificationRecord(
  overrides: Partial<NotificationResponse> = {}
): NotificationResponse {
  return {
    id: "notif-1",
    recipientId: "user-b",
    actorId: "user-a",
    type: "like",
    resourceType: "post",
    resourceId: "post-123",
    message: "Un utilisateur a aimé votre post",
    isRead: false,
    createdAt: new Date("2026-06-04T10:00:00.000Z"),
    readAt: null,
    ...overrides,
  };
}

export function createNotificationDocument(
  overrides: Record<string, unknown> = {}
) {
  return {
    _id: "507f1f77bcf86cd799439011",
    recipientId: "user-b",
    actorId: "user-a",
    type: "like",
    resourceType: "post",
    resourceId: "post-123",
    message: "Un utilisateur a aimé votre post",
    isRead: false,
    readAt: null,
    createdAt: new Date("2026-06-04T10:00:00.000Z"),
    ...overrides,
  };
}
