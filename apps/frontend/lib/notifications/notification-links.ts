import type { UserNotification } from "@/types/notification";

export function getNotificationHref(
  notification: UserNotification
): string | null {
  if (notification.type === "follow") {
    const username = notification.actor?.username?.trim();
    return username ? `/profile/${username}` : null;
  }

  if (notification.type !== "like" && notification.type !== "mention") {
    return null;
  }

  if (notification.resourceType === "post") {
    return `/posts/${notification.resourceId}`;
  }

  if (!notification.postId) {
    return null;
  }

  return `/posts/${notification.postId}?comment=${encodeURIComponent(notification.resourceId)}`;
}

export function isNotificationNavigable(notification: UserNotification) {
  return getNotificationHref(notification) !== null;
}
