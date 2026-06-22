"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionIcon, Card, Group, Text } from "@mantine/core";
import { FiHeart, FiTrash2 } from "react-icons/fi";
import { fetchCommentPostId } from "@/lib/api/comment.service";
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

function getNotificationMessage(notification: UserNotification) {
  if (!notification.actorName) {
    return notification.message;
  }

  if (notification.resourceType === "post") {
    return {
      actorName: notification.actorName,
      suffix: " a aimé votre post",
    };
  }

  return {
    actorName: notification.actorName,
    suffix: " a aimé votre commentaire",
  };
}

function buildCommentLikeHref(notification: UserNotification) {
  if (!notification.postId) {
    return null;
  }

  return `/posts/${notification.postId}?comment=${notification.resourceId}`;
}

export default function InboxNotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: InboxNotificationItemProps) {
  const router = useRouter();
  const isPostLike =
    notification.type === "like" && notification.resourceType === "post";
  const isCommentLike =
    notification.type === "like" && notification.resourceType === "comment";
  const commentLikeHref = buildCommentLikeHref(notification);
  const notificationMessage = getNotificationMessage(notification);

  async function handleClick() {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
  }

  async function handleCommentLikeClick() {
    await handleClick();

    const postId =
      notification.postId ??
      (await fetchCommentPostId(notification.resourceId).catch(() => null));

    if (!postId) {
      return;
    }

    router.push(`/posts/${postId}?comment=${notification.resourceId}`);
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
          <FiHeart className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <Text size="sm" fw={notification.isRead ? 500 : 600} lh={1.45}>
            {typeof notificationMessage === "string" ? (
              notificationMessage
            ) : (
              <>
                <Text span fw={700}>
                  {notificationMessage.actorName}
                </Text>
                {notificationMessage.suffix}
              </>
            )}
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

  if (isPostLike) {
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

  if (isCommentLike && commentLikeHref) {
    return (
      <Link
        href={commentLikeHref}
        className="block no-underline text-inherit"
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  if (isCommentLike) {
    return (
      <button
        type="button"
        className="block w-full border-0 bg-transparent p-0 text-left"
        onClick={handleCommentLikeClick}
      >
        {content}
      </button>
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
