"use client";

import { useEffect, useState } from "react";
import { Alert, Group, Loader, Stack, Text } from "@mantine/core";
import CommentComposer from "@/components/comments/CommentComposer";
import CommentThread from "@/components/comments/CommentThread";
import ContentCard from "@/components/feed/ContentCard";
import { createComment, fetchPostComments } from "@/lib/api/comment.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { isApiStatusCode } from "@/lib/api/http-client";
import { likePost, unlikePost } from "@/lib/api/interaction.service";
import { fetchPostById } from "@/lib/api/post.service";
import { resolveCurrentUserId } from "@/lib/current-user.shared";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateLike,
  markLiked,
  markUnliked,
  selectLikeState,
} from "@/store/likesSlice";
import type { Comment } from "@/types/comment";
import type { Post } from "@/types/post";

type PostDetailProps = {
  postId: string;
};

export default function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLikePending, setIsLikePending] = useState(false);
  const dispatch = useAppDispatch();
  const likeState = useAppSelector((state) =>
    post ? selectLikeState(state, "post", post.id) : undefined
  );
  const likesCount = likeState?.likesCount ?? post?.likesCount ?? 0;
  const isLiked = likeState?.isLiked ?? post?.isLiked ?? false;

  useEffect(() => {
    let isMounted = true;

    async function loadPostDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const [postItem, commentItems] = await Promise.all([
          fetchPostById(postId),
          fetchPostComments(postId),
        ]);

        if (isMounted) {
          setPost(postItem);
          setComments(commentItems);

          if (postItem) {
            dispatch(
              hydrateLike({
                targetType: "post",
                targetId: postItem.id,
                likesCount: postItem.likesCount,
                isLiked: postItem.isLiked,
              })
            );
          }
        }
      } catch {
        if (isMounted) {
          setError("Impossible de charger le detail du post.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPostDetail();

    return () => {
      isMounted = false;
    };
  }, [dispatch, postId]);

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="green" />
      </Group>
    );
  }

  if (error) {
    return (
      <Alert color="red" variant="light">
        {error}
      </Alert>
    );
  }

  if (!post) {
    return (
      <Text c="gray.5" ta="center" py="xl">
        Post introuvable.
      </Text>
    );
  }

  async function handleCommentSubmit(content: string) {
    const comment = await createComment({ postId, content });

    setComments((currentComments) => [
      comment,
      ...currentComments,
    ]);
  }

  async function handleReplySubmit(parentComment: Comment, content: string) {
    const newReply = await createComment({
      postId,
      content,
      parentCommentId: parentComment.id,
    });

    setComments((currentComments) =>
      currentComments
        .map((comment) =>
          comment.id === parentComment.id
            ? { ...comment, repliesCount: comment.repliesCount + 1 }
            : comment
        )
        .concat(newReply)
    );
  }

  return (
    <Stack gap="md">
      <ContentCard
        type="post"
        author={post.author}
        content={post.content}
        media={post.media}
        createdAt={post.createdAt}
        likesCount={likesCount}
        commentsCount={comments.filter((comment) => !comment.parentCommentId).length}
        isLiked={isLiked}
        onLike={async () => {
          if (isLikePending) {
            return;
          }

          const currentUser = await getCurrentUserFromApi();
          const userId = resolveCurrentUserId(currentUser);

          setIsLikePending(true);

          if (isLiked) {
            dispatch(markUnliked({ targetType: "post", targetId: post.id }));
            try {
              await unlikePost(userId, post.id);
            } catch (error) {
              if (!isApiStatusCode(error, 404)) {
                dispatch(markLiked({ targetType: "post", targetId: post.id }));
              }
            } finally {
              setIsLikePending(false);
            }
            return;
          }

          dispatch(markLiked({ targetType: "post", targetId: post.id }));
          try {
            await likePost(userId, post.id);
          } catch (error) {
            if (!isApiStatusCode(error, 409)) {
              dispatch(markUnliked({ targetType: "post", targetId: post.id }));
            }
          } finally {
            setIsLikePending(false);
          }
        }}
      />
      <CommentComposer onSubmit={handleCommentSubmit} />
      <CommentThread comments={comments} onReplySubmit={handleReplySubmit} />
    </Stack>
  );
}
