"use client";

import Link from "next/link";
import { ActionIcon, Badge, Card, Group, Text } from "@mantine/core";
import { FiAtSign, FiHeart, FiTrash2, FiUserPlus } from "react-icons/fi";
import {
  getNotificationAriaLabel,
  getNotificationDisplayMessage,
  getNotificationTypeLabel,
  getResourceTypeLabel,
} from "@/lib/notification-labels";
import {
  getNotificationHref,
  isNotificationNavigable,
} from "@/lib/notifications/notification-links";
import type { UserNotification } from "@/types/notification";

type InboxNotificationItemProps = {
  notification: UserNotification;
  onMarkAsRead: (notificationId: string) => void | Promise<void>;
  onDelete: (notificationId: string) => void | Promise<void>;
};

type NotificationVisuals = {
  Icon: typeof FiHeart;
  accentColor: string;
  unreadDotClass: string;
  iconWrapperClass: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNotificationVisuals(type: UserNotification["type"]): NotificationVisuals {
  switch (type) {
    case "mention":
      return {
        Icon: FiAtSign,
        accentColor: "amber",
        unreadDotClass: "bg-amber-500",
        iconWrapperClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      };
    case "follow":
      return {
        Icon: FiUserPlus,
        accentColor: "blue",
        unreadDotClass: "bg-blue-500",
        iconWrapperClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      };
    default:
      return {
        Icon: FiHeart,
        accentColor: "green",
        unreadDotClass: "bg-breezy-green",
        iconWrapperClass: "bg-breezy-green/15 text-breezy-green",
      };
  }
}

function getUnreadStyles(type: UserNotification["type"]) {
  switch (type) {
    case "mention":
      return {
        background:
          "color-mix(in srgb, var(--mantine-color-amber-5) 8%, var(--card))",
        border:
          "color-mix(in srgb, var(--mantine-color-amber-5) 35%, var(--border))",
      };
    case "follow":
      return {
        background:
          "color-mix(in srgb, var(--mantine-color-blue-5) 8%, var(--card))",
        border:
          "color-mix(in srgb, var(--mantine-color-blue-5) 35%, var(--border))",
      };
    default:
      return {
        background:
          "color-mix(in srgb, var(--breezy-green) 8%, var(--card))",
        border:
          "color-mix(in srgb, var(--breezy-green) 35%, var(--border))",
      };
  }
}

export default function InboxNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: InboxNotificationItemProps) {
  const { Icon, accentColor, unreadDotClass, iconWrapperClass } =
    getNotificationVisuals(notification.type);
  const unreadStyles = getUnreadStyles(notification.type);
  const notificationHref = getNotificationHref(notification);
  const isNavigable = isNotificationNavigable(notification);

  async function handleClick() {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
  }

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await onDelete(notification.id);
  }

  const content = (
    <Card
      padding="md"
      radius="md"
      withBorder
      style={{
        backgroundColor: notification.isRead
          ? "var(--card)"
          : unreadStyles.background,
        borderColor: notification.isRead ? "var(--border)" : unreadStyles.border,
        cursor: "pointer",
      }}
    >
      <Group align="flex-start" wrap="nowrap" gap="sm">
        {!notification.isRead && (
          <span
            className={`mt-2 size-2 shrink-0 rounded-full ${unreadDotClass}`}
            aria-hidden="true"
          />
        )}
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconWrapperClass} ${notification.isRead ? "ml-0" : ""}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <Text size="sm" fw={notification.isRead ? 500 : 600} lh={1.45}>
            {getNotificationDisplayMessage(notification)}
          </Text>
          <Group gap="xs" mt={6} wrap="wrap">
            <Badge size="xs" variant="light" color={accentColor} radius="sm">
              {getNotificationTypeLabel(notification.type)}
            </Badge>
            <Text size="xs" c="dimmed">
              {getResourceTypeLabel(notification.resourceType)}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDate(notification.createdAt)}
            </Text>
          </Group>
        </div>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Supprimer la notification"
          onClick={handleDelete}
        >
          <FiTrash2 size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );

  const ariaLabel = getNotificationAriaLabel(notification);

  if (isNavigable && notificationHref) {
    return (
      <Link
        href={notificationHref}
        className="block no-underline text-inherit"
        aria-label={ariaLabel}
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="block w-full border-0 bg-transparent p-0 text-left"
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}
