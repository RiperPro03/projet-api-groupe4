import type { UserNotification } from "@/types/notification";

export type NotificationFilter = "all" | "like" | "mention";

export function getNotificationTypeLabel(
  type: UserNotification["type"]
): string {
  return type === "mention" ? "Mention" : "J'aime";
}

export function getResourceTypeLabel(
  resourceType: UserNotification["resourceType"]
): string {
  return resourceType === "comment" ? "Commentaire" : "Post";
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

export function getNotificationAriaLabel(
  notification: UserNotification
): string {
  const typeLabel = getNotificationTypeLabel(notification.type);
  const resourceLabel = getResourceTypeLabel(notification.resourceType);
  const readState = notification.isRead ? "lue" : "non lue";

  return `${typeLabel} dans un ${resourceLabel.toLowerCase()}, ${readState}`;
}

export function getEmptyFilterMessage(filter: NotificationFilter): string {
  switch (filter) {
    case "mention":
      return "Aucune mention pour le moment.";
    case "like":
      return "Aucun j'aime pour le moment.";
    default:
      return "Aucune notification pour le moment.";
  }
}
