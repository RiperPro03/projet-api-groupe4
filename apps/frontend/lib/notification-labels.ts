import type { UserNotification } from "@/types/notification";

export type NotificationFilter = "all" | "like" | "mention" | "follow";

export function getNotificationTypeLabel(
  type: UserNotification["type"]
): string {
  switch (type) {
    case "mention":
      return "Mention";
    case "follow":
      return "Abonné";
    default:
      return "J'aime";
  }
}

export function getResourceTypeLabel(
  resourceType: UserNotification["resourceType"]
): string {
  switch (resourceType) {
    case "comment":
      return "Commentaire";
    case "user":
      return "Profil";
    default:
      return "Post";
  }
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
  notification: UserNotification
): string {
  const actorName = notification.actor?.name?.trim();

  if (!actorName) {
    return notification.message;
  }

  if (notification.type === "follow") {
    return `${actorName} a commencé à vous suivre`;
  }

  if (notification.type === "like") {
    return notification.resourceType === "post"
      ? `${actorName} a aimé votre post`
      : `${actorName} a aimé votre commentaire`;
  }

  return notification.resourceType === "post"
    ? `${actorName} vous a mentionné dans un post`
    : `${actorName} vous a mentionné dans un commentaire`;
}

export function getNotificationAriaLabel(
  notification: UserNotification
): string {
  const typeLabel = getNotificationTypeLabel(notification.type);
  const resourceLabel = getResourceTypeLabel(notification.resourceType);
  const readState = notification.isRead ? "lue" : "non lue";
  const actorName = notification.actor?.name?.trim();

  if (notification.type === "follow" && actorName) {
    return `${actorName} a commencé à vous suivre, ${readState}`;
  }

  if (actorName) {
    return `${actorName}, ${typeLabel.toLowerCase()} dans un ${resourceLabel.toLowerCase()}, ${readState}`;
  }

  return `${typeLabel} dans un ${resourceLabel.toLowerCase()}, ${readState}`;
}

export function getEmptyFilterMessage(filter: NotificationFilter): string {
  switch (filter) {
    case "mention":
      return "Aucune mention pour le moment.";
    case "like":
      return "Aucun j'aime pour le moment.";
    case "follow":
      return "Aucun nouvel abonné pour le moment.";
    default:
      return "Aucune notification pour le moment.";
  }
}
