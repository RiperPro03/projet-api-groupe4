"use client";

import Link from "next/link";
import { ActionIcon, Card, Group, Text } from "@mantine/core";
import { FiAtSign, FiHeart, FiTrash2 } from "react-icons/fi";
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
  const isPostLink =
    notification.resourceType === "post" &&
    (notification.type === "like" || notification.type === "mention");
  const Icon = notification.type === "mention" ? FiAtSign : FiHeart;

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
          : "color-mix(in srgb, var(--breezy-green) 8%, var(--card))",
        borderColor: notification.isRead
          ? "var(--border)"
          : "color-mix(in srgb, var(--breezy-green) 35%, var(--border))",
        cursor: "pointer",
      }}
    >
      <Group align="flex-start" wrap="nowrap" gap="sm">
        {!notification.isRead && (
          <span
            className="mt-2 size-2 shrink-0 rounded-full bg-breezy-green"
            aria-hidden="true"
          />
        )}
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-breezy-green/15 text-breezy-green ${notification.isRead ? "ml-0" : ""}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <Text size="sm" fw={notification.isRead ? 500 : 600} lh={1.45}>
            {notification.message}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {formatDate(notification.createdAt)}
          </Text>
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

  if (isPostLink) {
    return (
      <Link
        href={`/posts/${notification.resourceId}`}
        className="block no-underline text-inherit"
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
      onClick={handleClick}
    >
      {content}
    </button>
  );
}
