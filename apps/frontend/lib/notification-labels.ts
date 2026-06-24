import type { UserNotification } from "@/types/notification";

export type NotificationFilter = "all" | "like" | "mention";

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function getNotificationTypeLabel(
  type: UserNotification["type"],
  t: Translate
): string {
  return type === "mention"
    ? t("notifications.typeMention")
    : t("notifications.typeLike");
}

export function getResourceTypeLabel(
  resourceType: UserNotification["resourceType"],
  t: Translate
): string {
  return resourceType === "comment"
    ? t("notifications.resourceComment")
    : t("notifications.resourcePost");
}

export function matchesNotificationFilter(
  notification: UserNotification,
  filter: NotificationFilter
): boolean {
  if (filter === "all") {
    return true;
  }

  return notification.type === filter;
}

export function getNotificationDisplayMessage(
  notification: UserNotification,
  t: Translate
): string {
  const actor = notification.actor?.name?.trim() || t("notifications.someone");

  if (notification.type === "like") {
    return notification.resourceType === "post"
      ? t("notifications.likePost", { actor })
      : t("notifications.likeComment", { actor });
  }

  return notification.resourceType === "post"
    ? t("notifications.mentionPost", { actor })
    : t("notifications.mentionComment", { actor });
}

export function getNotificationAriaLabel(
  notification: UserNotification,
  t: Translate
): string {
  const typeLabel = getNotificationTypeLabel(notification.type, t).toLowerCase();
  const resourceLabel = getResourceTypeLabel(notification.resourceType, t).toLowerCase();
  const readState = notification.isRead
    ? t("notifications.read")
    : t("notifications.unread");
  const actorName = notification.actor?.name?.trim();

  if (actorName) {
    return t("notifications.ariaWithActor", {
      actor: actorName,
      type: typeLabel,
      resource: resourceLabel,
      readState,
    });
  }

  return t("notifications.ariaGeneric", {
    type: typeLabel,
    resource: resourceLabel,
    readState,
  });
}

export function getEmptyFilterMessage(filter: NotificationFilter, t: Translate): string {
  switch (filter) {
    case "mention":
      return t("notifications.emptyMentions");
    case "like":
      return t("notifications.emptyLikes");
    default:
      return t("notifications.emptyAll");
  }
}
