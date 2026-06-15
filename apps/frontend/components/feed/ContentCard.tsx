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
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import type { Author, Media } from "@/types/post";

type ContentCardProps = {
  type: "post" | "comment";
  author: Author;
  content: string;
  media?: Media[];
  createdAt: string;
  likesCount: number;
  commentsCount?: number;
  repliesCount?: number;
  isReply?: boolean;
  onComment?: () => void;
  onLike?: () => void;
};

const urlRegex = /(https?:\/\/[^\s]+)/g;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function countLabel(value = 0) {
  return new Intl.NumberFormat("fr-FR", {
    notation: value > 999 ? "compact" : "standard",
  }).format(value);
}

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(urlRegex);

  return (
    <Text component="p" m={0} lh={1.55} c="gray.0" style={{ whiteSpace: "pre-wrap" }}>
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
  if (media.length === 0) {
    return null;
  }

  return (
    <Box
      mt="sm"
      style={{
        display: "grid",
        gridTemplateColumns: media.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
        gap: 8,
      }}
    >
      {media.map((item) => (
        <Box
          key={item.id}
          style={{
            aspectRatio: media.length === 1 ? "16 / 10" : "1 / 1",
            overflow: "hidden",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "rgba(255, 255, 255, 0.04)",
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
              aria-label={item.alt ?? "Video du contenu"}
              style={{
                display: "block",
                height: "100%",
                width: "100%",
                objectFit: "cover",
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
}: {
  label: string;
  count?: number;
  onClick?: () => void;
  children: React.ReactNode;
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
        <Text size="sm" c="gray.5" miw={20}>
          {countLabel(count)}
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
  commentsCount,
  repliesCount,
  isReply = false,
  onComment,
  onLike,
}: ContentCardProps) {
  const discussionCount = type === "post" ? commentsCount : repliesCount;
  const initials = author.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      radius={8}
      p="md"
      withBorder
      bg="rgba(9, 12, 11, 0.92)"
      style={{
        borderColor: isReply ? "rgba(0, 146, 62, 0.28)" : "rgba(255, 255, 255, 0.12)",
        width: "100%",
      }}
    >
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <Avatar src={author.avatarUrl} alt={author.name} radius="xl" size={44}>
          {initials}
        </Avatar>

        <Stack gap={8} flex={1} style={{ minWidth: 0 }}>
          <Group gap={6} wrap="wrap">
            <Text fw={700} c="gray.0" size="sm">
              {author.name}
            </Text>
            <Text c="gray.5" size="sm">
              @{author.username}
            </Text>
            <Text c="gray.6" size="sm">
              ·
            </Text>
            <Text c="gray.5" size="sm">
              {formatDate(createdAt)}
            </Text>
          </Group>

          <LinkifiedText text={content} />
          <MediaGrid media={media} />

          <Group gap="xl" mt={4}>
            <ActionButton
              label={type === "post" ? "Commenter" : "Repondre"}
              count={discussionCount}
              onClick={onComment}
            >
              <FiMessageCircle size={18} />
            </ActionButton>
            <ActionButton label="Aimer" count={likesCount} onClick={onLike}>
              <FiHeart size={18} />
            </ActionButton>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}
