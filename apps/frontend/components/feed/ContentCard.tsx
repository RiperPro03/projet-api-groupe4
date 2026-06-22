"use client";

import {
  ActionIcon,
  Anchor,
  Avatar,
  Box,
  Card,
  Group,
  Image,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import type { ReactNode } from "react";
import { FiHeart, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import { useI18n } from "@/lib/i18n/client";
import PostLikersAvatars from "@/components/posts/PostLikersAvatars";
import type { Author, Media } from "@/types/post";

type ContentCardProps = {
  type: "post" | "comment";
  author: Author;
  content: string;
  media?: Media[];
  createdAt: string;
  likesCount: number;
  likers?: Author[];
  commentsCount?: number;
  repliesCount?: number;
  isReply?: boolean;
  isLiked?: boolean;
  onComment?: () => void;
  onLike?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
};

const urlRegex = /(https?:\/\/[^\s]+)/g;

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function countLabel(value = 0, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: value > 999 ? "compact" : "standard",
  }).format(value);
}

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(urlRegex);

  return (
    <Text
      component="p"
      m={0}
      lh={1.55}
      style={{ color: "var(--foreground)", whiteSpace: "pre-wrap" }}
    >
      {parts.map((part, index) => {
        const isUrl = /^https?:\/\/[^\s]+$/.test(part);

        if (!isUrl) {
          return part;
        }

        return (
          <Anchor
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            c="green.4"
            underline="hover"
          >
            {part}
          </Anchor>
        );
      })}
    </Text>
  );
}

function MediaGrid({ media = [] }: { media?: Media[] }) {
  const { t } = useI18n();

  if (media.length === 0) {
    return null;
  }

  return (
    <Box
      mt="sm"
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: media.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
        width: "100%",
      }}
    >
      {media.map((item) => (
        <Box
          key={item.id}
          style={{
            aspectRatio: media.length === 1 ? "16 / 10" : "1 / 1",
            background: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {item.type === "image" ? (
            <Image
              src={item.url}
              alt={item.alt ?? ""}
              h="100%"
              w="100%"
              fit="cover"
            />
          ) : (
            <video
              controls
              preload="metadata"
              aria-label={item.alt ?? t("content.videoContent")}
              style={{
                display: "block",
                height: "100%",
                objectFit: "cover",
                width: "100%",
              }}
            >
              <source src={item.url} />
            </video>
          )}
        </Box>
      ))}
    </Box>
  );
}

function ActionButton({
  label,
  count,
  onClick,
  children,
  locale,
}: {
  label: string;
  count?: number;
  onClick?: () => void;
  children: ReactNode;
  locale: string;
}) {
  return (
    <Group gap={6} wrap="nowrap">
      <Tooltip label={label}>
        <ActionIcon
          aria-label={label}
          variant="subtle"
          color="gray"
          radius="xl"
          size="lg"
          onClick={onClick}
        >
          {children}
        </ActionIcon>
      </Tooltip>
      {typeof count === "number" && (
        <Text size="sm" style={{ color: "var(--muted-foreground)" }} miw={20}>
          {countLabel(count, locale)}
        </Text>
      )}
    </Group>
  );
}

export default function ContentCard({
  type,
  author,
  content,
  media = [],
  createdAt,
  likesCount,
  likers = [],
  commentsCount,
  repliesCount,
  isReply = false,
  isLiked = false,
  onComment,
  onLike,
  onDelete,
  isDeleting = false,
}: ContentCardProps) {
  const { dateLocale, t } = useI18n();
  const discussionCount = type === "post" ? commentsCount : repliesCount;
  const initials = author.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const shouldUseFullWidthBody = type === "post" && !isReply;

  const metaContent = (
    <Group gap={6} wrap="wrap">
      <Text fw={700} style={{ color: "var(--foreground)" }} size="sm">
        {author.name}
      </Text>
      <Text style={{ color: "var(--muted-foreground)" }} size="sm">
        @{author.username}
      </Text>
      <Text style={{ color: "var(--muted-foreground)" }} size="sm">
        &middot;
      </Text>
      <Text style={{ color: "var(--muted-foreground)" }} size="sm">
        {formatDate(createdAt, dateLocale)}
      </Text>
    </Group>
  );

  const bodyContent = (
    <>
      <LinkifiedText text={content} />
      <MediaGrid media={media} />

      <Group gap="xl" mt={4} align="center">
        <ActionButton
          label={type === "post" ? t("content.comment") : t("content.reply")}
          count={discussionCount}
          onClick={onComment}
          locale={dateLocale}
        >
          <FiMessageCircle size={18} />
        </ActionButton>
        <Group gap="sm" wrap="nowrap" align="center">
          <ActionButton
            label={isLiked ? t("content.unlike") : t("content.like")}
            count={likesCount}
            onClick={onLike}
            locale={dateLocale}
          >
            <Box c={isLiked ? "green.4" : undefined} component="span" lh={0}>
              <FiHeart size={18} />
            </Box>
          </ActionButton>
          {type === "post" && likers.length > 0 && (
            <PostLikersAvatars
              likers={likers}
              likesCount={likesCount}
              size="sm"
            />
          )}
        </Group>
      </Group>
    </>
  );

  return (
    <Card
      radius={8}
      p="md"
      withBorder
      bg="var(--card)"
      style={{
        borderColor: isReply ? "rgb(var(--breezy-green-rgb) / 0.28)" : "var(--border)",
        position: "relative",
        width: "100%",
      }}
    >
      {onDelete && (
        <Tooltip label={t("content.deletePost")}>
          <ActionIcon
            aria-label={t("content.deletePost")}
            disabled={isDeleting}
            loading={isDeleting}
            onClick={onDelete}
            radius="xl"
            size="sm"
            variant="subtle"
            style={{
              color: "var(--destructive)",
              position: "absolute",
              right: 12,
              top: 12,
            }}
          >
            <FiTrash2 size={16} />
          </ActionIcon>
        </Tooltip>
      )}

      {shouldUseFullWidthBody ? (
        <Stack gap={10}>
          <Group
            align="flex-start"
            gap="sm"
            wrap="nowrap"
            style={{ paddingRight: onDelete ? 36 : undefined }}
          >
            <Avatar src={author.avatarUrl} alt={author.name} radius="xl" size={44}>
              {initials}
            </Avatar>

            <Box style={{ flex: 1, minWidth: 0 }}>
              {metaContent}
            </Box>
          </Group>

          <Stack gap={8}>
            {bodyContent}
          </Stack>
        </Stack>
      ) : (
        <Group align="flex-start" gap="sm" wrap="nowrap">
          <Avatar src={author.avatarUrl} alt={author.name} radius="xl" size={44}>
            {initials}
          </Avatar>

          <Stack gap={8} style={{ flex: 1, minWidth: 0 }}>
            {metaContent}
            {bodyContent}
          </Stack>
        </Group>
      )}
    </Card>
  );
}
