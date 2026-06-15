"use client";

import { useState } from "react";
import { Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import CommentComposer from "@/components/comments/CommentComposer";
import ContentCard from "@/components/feed/ContentCard";
import type { Comment } from "@/types/comment";

type CommentThreadProps = {
  comments: Comment[];
  maxVisualDepth?: number;
  onReplySubmit?: (parentComment: Comment, content: string) => void | Promise<void>;
};

type CommentNode = Comment & {
  replies: CommentNode[];
};

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach((comment) => {
    nodes.set(comment.id, { ...comment, replies: [] });
  });

  nodes.forEach((node) => {
    if (!node.parentCommentId) {
      roots.push(node);
      return;
    }

    const parent = nodes.get(node.parentCommentId);

    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function ThreadNode({
  node,
  depth,
  maxVisualDepth,
  activeReplyId,
  onStartReply,
  onCancelReply,
  onReplySubmit,
}: {
  node: CommentNode;
  depth: number;
  maxVisualDepth: number;
  activeReplyId: string | null;
  onStartReply: (comment: Comment) => void;
  onCancelReply: () => void;
  onReplySubmit?: (parentComment: Comment, content: string) => void | Promise<void>;
}) {
  const visualDepth = Math.min(depth, maxVisualDepth);
  const isReplying = activeReplyId === node.id;

  return (
    <Box
      pl={{ base: visualDepth * 14, sm: visualDepth * 22 }}
      style={{
        borderLeft:
          depth > 0 ? "1px solid rgba(255, 255, 255, 0.12)" : undefined,
      }}
    >
      <Stack gap="sm">
        <ContentCard
          type="comment"
          author={node.author}
          content={node.content}
          media={node.media}
          createdAt={node.createdAt}
          likesCount={node.likesCount}
          repliesCount={node.repliesCount}
          isReply={depth > 0}
          onComment={() => onStartReply(node)}
        />

        {isReplying && (
          <Paper
            withBorder
            radius={8}
            p="sm"
            bg="rgba(0, 146, 62, 0.08)"
            style={{ borderColor: "rgba(0, 146, 62, 0.32)" }}
          >
            <Group justify="space-between" align="center" mb="xs">
              <Text size="sm" c="green.3" fw={600}>
                Reponse a @{node.author.username}
              </Text>
              <Button
                variant="subtle"
                color="gray"
                size="compact-sm"
                onClick={onCancelReply}
              >
                Annuler
              </Button>
            </Group>
            <CommentComposer
              placeholder={`Repondre a @${node.author.username}...`}
              onSubmit={async (content) => {
                await onReplySubmit?.(node, content);
                onCancelReply();
              }}
            />
          </Paper>
        )}

        {node.replies.map((reply) => (
          <ThreadNode
            key={reply.id}
            node={reply}
            depth={depth + 1}
            maxVisualDepth={maxVisualDepth}
            activeReplyId={activeReplyId}
            onStartReply={onStartReply}
            onCancelReply={onCancelReply}
            onReplySubmit={onReplySubmit}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default function CommentThread({
  comments,
  maxVisualDepth = 3,
  onReplySubmit,
}: CommentThreadProps) {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const tree = buildCommentTree(comments);

  if (tree.length === 0) {
    return (
      <Text c="gray.5" ta="center" py="xl">
        Aucun commentaire pour le moment.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {tree.map((node) => (
        <ThreadNode
          key={node.id}
          node={node}
          depth={0}
          maxVisualDepth={maxVisualDepth}
          activeReplyId={activeReplyId}
          onStartReply={(comment) => setActiveReplyId(comment.id)}
          onCancelReply={() => setActiveReplyId(null)}
          onReplySubmit={onReplySubmit}
        />
      ))}
    </Stack>
  );
}
