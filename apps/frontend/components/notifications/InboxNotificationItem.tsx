"use client";

import Link from "next/link";
import { ActionIcon, Badge, Card, Group, Text } from "@mantine/core";
import { FiAtSign, FiHeart, FiTrash2 } from "react-icons/fi";
import {
  getNotificationAriaLabel,
  getNotificationDisplayMessage,
  getNotificationTypeLabel,
  getResourceTypeLabel,
} from "@/lib/notification-labels";
import type { UserNotification } from "@/types/notification";

type InboxNotificationItemProps = {
  notification: UserNotification;
  onMarkAsRead: (notificationId: string) => void | Promise<void>;
  onDelete: (notificationId: string) => void | Promise<void>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function InboxNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: InboxNotificationItemProps) {
  const isMention = notification.type === "mention";
  const isPostLink =
    notification.resourceType === "post" &&
    (notification.type === "like" || notification.type === "mention");
  const Icon = isMention ? FiAtSign : FiHeart;
  const accentColor = isMention ? "amber" : "green";
  const unreadDotClass = isMention ? "bg-amber-500" : "bg-breezy-green";
  const iconWrapperClass = isMention
    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
    : "bg-breezy-green/15 text-breezy-green";

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

  const unreadBackground = isMention
    ? "color-mix(in srgb, var(--mantine-color-amber-5) 8%, var(--card))"
    : "color-mix(in srgb, var(--breezy-green) 8%, var(--card))";
  const unreadBorder = isMention
    ? "color-mix(in srgb, var(--mantine-color-amber-5) 35%, var(--border))"
    : "color-mix(in srgb, var(--breezy-green) 35%, var(--border))";

  const content = (
    <Card
      padding="md"
      radius="md"
      withBorder
      style={{
        backgroundColor: notification.isRead ? "var(--card)" : unreadBackground,
        borderColor: notification.isRead ? "var(--border)" : unreadBorder,
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

  if (isPostLink) {
    return (
      <Link
        href={`/posts/${notification.resourceId}`}
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
