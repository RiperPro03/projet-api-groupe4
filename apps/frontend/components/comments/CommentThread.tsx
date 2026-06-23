"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Group, Paper, Stack, Text } from "@mantine/core";
import CommentComposer from "@/components/comments/CommentComposer";
import ContentCard from "@/components/feed/ContentCard";
import { RippleButton } from "@/components/ui/ripple-button";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { isApiStatusCode } from "@/lib/api/http-client";
import { likeComment, unlikeComment } from "@/lib/api/interaction.service";
import { getAuthenticatedUserId } from "@/lib/current-user-ids";
import { useI18n } from "@/lib/i18n/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateLike,
  markLiked,
  markUnliked,
  selectLikeState,
} from "@/store/likesSlice";
import type { Comment } from "@/types/comment";

type CommentThreadProps = {
  comments: Comment[];
  maxVisualDepth?: number;
  highlightCommentId?: string | null;
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
  highlightCommentId,
  onStartReply,
  onCancelReply,
  onReplySubmit,
}: {
  node: CommentNode;
  depth: number;
  maxVisualDepth: number;
  activeReplyId: string | null;
  highlightCommentId?: string | null;
  onStartReply: (comment: Comment) => void;
  onCancelReply: () => void;
  onReplySubmit?: (parentComment: Comment, content: string) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const commentRef = useRef<HTMLDivElement | null>(null);
  const visualDepth = Math.min(depth, maxVisualDepth);
  const isReplying = activeReplyId === node.id;
  const isHighlighted = highlightCommentId === node.id;
  const dispatch = useAppDispatch();
  const likeState = useAppSelector((state) =>
    selectLikeState(state, "comment", node.id)
  );
  const likesCount = likeState?.likesCount ?? node.likesCount;
  const isLiked = likeState?.isLiked ?? node.isLiked ?? false;
  const [isLikePending, setIsLikePending] = useState(false);

  useEffect(() => {
    dispatch(
      hydrateLike({
        targetType: "comment",
        targetId: node.id,
        likesCount: node.likesCount,
        isLiked: node.isLiked,
      })
    );
  }, [dispatch, node.id, node.isLiked, node.likesCount]);

  useEffect(() => {
    if (!isHighlighted || !commentRef.current) {
      return;
    }

    commentRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [isHighlighted]);

  async function handleLike() {
    if (isLikePending) {
      return;
    }

    const currentUser = await getCurrentUserFromApi();
    const userId = getAuthenticatedUserId(currentUser);

    setIsLikePending(true);

    if (isLiked) {
      dispatch(markUnliked({ targetType: "comment", targetId: node.id }));
      try {
        await unlikeComment(userId, node.id);
      } catch (error) {
        if (!isApiStatusCode(error, 404)) {
          dispatch(markLiked({ targetType: "comment", targetId: node.id }));
        }
      } finally {
        setIsLikePending(false);
      }
      return;
    }

    dispatch(markLiked({ targetType: "comment", targetId: node.id }));
    try {
      await likeComment(userId, node.id, node.id_post);
    } catch (error) {
      if (!isApiStatusCode(error, 409)) {
        dispatch(markUnliked({ targetType: "comment", targetId: node.id }));
      }
    } finally {
      setIsLikePending(false);
    }
  }

  return (
    <Box
      ref={commentRef}
      id={`comment-${node.id}`}
      pl={{ base: visualDepth * 14, sm: visualDepth * 22 }}
      style={{
        borderLeft:
          depth > 0 ? "1px solid var(--border)" : undefined,
        borderRadius: isHighlighted ? 8 : undefined,
        boxShadow: isHighlighted
          ? "0 0 0 2px rgb(var(--breezy-green-rgb) / 0.45)"
          : undefined,
        transition: "box-shadow 0.2s ease",
      }}
    >
      <Stack gap="sm">
        <ContentCard
          type="comment"
          author={node.author}
          content={node.content}
          media={node.media}
          createdAt={node.createdAt}
          likesCount={likesCount}
          repliesCount={node.repliesCount}
          isReply={depth > 0}
          isLiked={isLiked}
          onComment={() => onStartReply(node)}
          onLike={handleLike}
        />

        {isReplying && (
          <Paper
            withBorder
            radius={8}
            p="sm"
            bg="rgb(var(--breezy-green-rgb) / 0.08)"
            style={{ borderColor: "rgb(var(--breezy-green-rgb) / 0.32)" }}
          >
            <Group justify="space-between" align="center" mb="xs">
              <Text size="sm" c="green.3" fw={600}>
                {t("comment.replyTo", { username: node.author.username })}
              </Text>
              <RippleButton
                type="button"
                rippleColor="var(--foreground)"
                onClick={onCancelReply}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {t("common.cancel")}
              </RippleButton>
            </Group>
            <CommentComposer
              placeholder={t("comment.replyPlaceholder", {
                username: node.author.username,
              })}
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
            highlightCommentId={highlightCommentId}
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
  highlightCommentId = null,
  onReplySubmit,
}: CommentThreadProps) {
  const { t } = useI18n();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const tree = buildCommentTree(comments);

  if (tree.length === 0) {
    return (
      <Text style={{ color: "var(--muted-foreground)" }} ta="center" py="xl">
        {t("comment.noComments")}
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
          highlightCommentId={highlightCommentId}
          onStartReply={(comment) => setActiveReplyId(comment.id)}
          onCancelReply={() => setActiveReplyId(null)}
          onReplySubmit={onReplySubmit}
        />
      ))}
    </Stack>
  );
}
