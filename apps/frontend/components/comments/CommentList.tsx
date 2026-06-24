"use client";

import { useEffect, useState } from "react";
import { Alert, Group, Loader, Modal, Stack, Text } from "@mantine/core";
import { FiTrash2 } from "react-icons/fi";
import { AnimatedList } from "@/components/ui/animated-list";
import ContentCard from "@/components/feed/ContentCard";
import { RippleButton } from "@/components/ui/ripple-button";
import { useCommentList } from "@/hooks/useCommentList";
import { deleteComment } from "@/lib/api/comment.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { getApiErrorMessage, isApiStatusCode } from "@/lib/api/http-client";
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

type CommentListProps = {
  fetchComments: () => Promise<Comment[]>;
};

const secondaryButtonClassName =
  "rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60";
const destructiveButtonClassName =
  "rounded-full border-0 bg-destructive px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-destructive/20 transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60";

function CommentListItem({
  comment,
  currentUserId,
  onDeleteComment,
}: {
  comment: Comment;
  currentUserId: string | null;
  onDeleteComment: (comment: Comment) => Promise<void>;
}) {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const likeState = useAppSelector((state) =>
    selectLikeState(state, "comment", comment.id)
  );
  const likesCount = likeState?.likesCount ?? comment.likesCount;
  const isLiked = likeState?.isLiked ?? comment.isLiked ?? false;
  const [isLikePending, setIsLikePending] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const canDeleteComment =
    currentUserId !== null && comment.author.id === currentUserId;

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
    const userId = getAuthenticatedUserId(currentUser);

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

  async function confirmDeleteComment() {
    if (isDeletingComment) {
      return;
    }

    setIsDeletingComment(true);
    try {
      await onDeleteComment(comment);
    } finally {
      setIsDeletingComment(false);
      setIsDeleteConfirmOpen(false);
    }
  }

  return (
    <>
      <Modal
        opened={isDeleteConfirmOpen}
        onClose={() => {
          if (!isDeletingComment) {
            setIsDeleteConfirmOpen(false);
          }
        }}
        title={t("comment.deleteTitle")}
        centered
        radius={8}
        closeOnClickOutside={!isDeletingComment}
        closeOnEscape={!isDeletingComment}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
      >
        <Stack gap="md">
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            {t("comment.deleteDescription")}
          </Text>

          <Group justify="flex-end">
            <RippleButton
              type="button"
              rippleColor="var(--foreground)"
              disabled={isDeletingComment}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className={secondaryButtonClassName}
            >
              {t("common.cancel")}
            </RippleButton>
            <RippleButton
              type="button"
              rippleColor="var(--foreground)"
              disabled={isDeletingComment}
              onClick={confirmDeleteComment}
              className={destructiveButtonClassName}
            >
              <span className="flex items-center gap-2">
                <FiTrash2 size={16} />
                {isDeletingComment ? t("comment.deleting") : t("common.delete")}
              </span>
            </RippleButton>
          </Group>
        </Stack>
      </Modal>

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
        isDeleting={isDeletingComment}
        onDelete={
          canDeleteComment
            ? () => {
                if (isDeletingComment) {
                  return;
                }

                setIsDeleteConfirmOpen(true);
              }
            : undefined
        }
        onLike={handleLike}
      />
    </>
  );
}

export default function CommentList({ fetchComments }: CommentListProps) {
  const { t } = useI18n();
  const { comments, isLoading, error, removeComment, restoreComment } =
    useCommentList({ fetchComments });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentActionError, setCommentActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserFromApi()
      .then((currentUser) => {
        if (isMounted) {
          setCurrentUserId(getAuthenticatedUserId(currentUser));
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDeleteComment(comment: Comment) {
    setCommentActionError(null);
    removeComment(comment.id);

    try {
      await deleteComment(comment.id);
    } catch (deleteError) {
      restoreComment(comment);
      setCommentActionError(
        t("comment.deleteImpossible", {
          message: getApiErrorMessage(
            deleteError,
            t("common.unknownError"),
            t("common.serverUnreachable")
          ),
        })
      );
    }
  }

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

      {commentActionError && (
        <Alert
          variant="light"
          style={{
            backgroundColor: "color-mix(in oklch, var(--destructive) 12%, transparent)",
            borderColor: "color-mix(in oklch, var(--destructive) 35%, transparent)",
            color: "var(--destructive)",
          }}
        >
          {commentActionError}
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
              currentUserId={currentUserId}
              onDeleteComment={handleDeleteComment}
            />
          ))}
        </AnimatedList>
      )}
    </Stack>
  );
}
