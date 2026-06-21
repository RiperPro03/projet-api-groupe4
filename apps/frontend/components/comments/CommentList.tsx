"use client";

import { useEffect, useState } from "react";
import { Alert, Group, Loader, Stack, Text } from "@mantine/core";
import { AnimatedList } from "@/components/ui/animated-list";
import ContentCard from "@/components/feed/ContentCard";
import { useCommentList } from "@/hooks/useCommentList";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { isApiStatusCode } from "@/lib/api/http-client";
import { likeComment, unlikeComment } from "@/lib/api/interaction.service";
import { useI18n } from "@/lib/i18n/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateLike,
  markLiked,
  markUnliked,
  selectLikeState,
} from "@/store/likesSlice";
import type { Comment } from "@/types/comment";

type CommentListProps = {
  fetchComments: () => Promise<Comment[]>;
};

function CommentListItem({ comment }: { comment: Comment }) {
  const dispatch = useAppDispatch();
  const likeState = useAppSelector((state) =>
    selectLikeState(state, "comment", comment.id)
  );
  const likesCount = likeState?.likesCount ?? comment.likesCount;
  const isLiked = likeState?.isLiked ?? comment.isLiked ?? false;
  const [isLikePending, setIsLikePending] = useState(false);

  useEffect(() => {
    dispatch(
      hydrateLike({
        targetType: "comment",
        targetId: comment.id,
        likesCount: comment.likesCount,
        isLiked: comment.isLiked,
      })
    );
  }, [comment.id, comment.isLiked, comment.likesCount, dispatch]);

  async function handleLike() {
    if (isLikePending) {
      return;
    }

    const currentUser = await getCurrentUserFromApi();
    const userId = currentUser.auth.id;

    setIsLikePending(true);

    if (isLiked) {
      dispatch(markUnliked({ targetType: "comment", targetId: comment.id }));
      try {
        await unlikeComment(userId, comment.id);
      } catch (error) {
        if (!isApiStatusCode(error, 404)) {
          dispatch(markLiked({ targetType: "comment", targetId: comment.id }));
        }
      } finally {
        setIsLikePending(false);
      }
      return;
    }

    dispatch(markLiked({ targetType: "comment", targetId: comment.id }));
    try {
      await likeComment(userId, comment.id, comment.id_post);
    } catch (error) {
      if (!isApiStatusCode(error, 409)) {
        dispatch(markUnliked({ targetType: "comment", targetId: comment.id }));
      }
    } finally {
      setIsLikePending(false);
    }
  }

  return (
    <ContentCard
      type="comment"
      author={comment.author}
      content={comment.content}
      media={comment.media}
      createdAt={comment.createdAt}
      likesCount={likesCount}
      repliesCount={comment.repliesCount}
      isReply={Boolean(comment.parentCommentId)}
      isLiked={isLiked}
      onLike={handleLike}
    />
  );
}

export default function CommentList({ fetchComments }: CommentListProps) {
  const { t } = useI18n();
  const { comments, isLoading, error } = useCommentList({ fetchComments });

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="green" />
      </Group>
    );
  }

  return (
    <Stack gap="md">
      {error && (
        <Alert
          variant="light"
          style={{
            backgroundColor: "color-mix(in oklch, var(--destructive) 12%, transparent)",
            borderColor: "color-mix(in oklch, var(--destructive) 35%, transparent)",
            color: "var(--destructive)",
          }}
        >
          {error}
        </Alert>
      )}

      {comments.length === 0 ? (
        <Text c="gray.5" ta="center" py="xl">
          {t("comment.noComments")}
        </Text>
      ) : (
        <AnimatedList delay={120} className="gap-3">
          {[...comments].reverse().map((comment) => (
            <CommentListItem
              key={comment.id}
              comment={comment}
            />
          ))}
        </AnimatedList>
      )}
    </Stack>
  );
}
