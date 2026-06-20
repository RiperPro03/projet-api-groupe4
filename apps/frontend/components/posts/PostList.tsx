"use client";

import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { FiPlus, FiSend } from "react-icons/fi";
import CommentComposer from "@/components/comments/CommentComposer";
import CommentThread from "@/components/comments/CommentThread";
import { AnimatedList } from "@/components/ui/animated-list";
import { usePostList, type FetchPostPage } from "@/hooks/usePostList";
import { createComment } from "@/lib/api/comment.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { isApiStatusCode } from "@/lib/api/http-client";
import { likePost, unlikePost } from "@/lib/api/interaction.service";
import { createPost } from "@/lib/api/post.service";
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
import ContentCard from "@/components/feed/ContentCard";

type PostListProps = {
  fetchPosts: FetchPostPage;
  fetchUpdatedPosts?: FetchPostPage;
  fetchCommentsForPost?: (postId: string) => Promise<Comment[]>;
  pageSize?: number;
  title?: string;
};

function PostFeedItem({
  post,
  fetchCommentsForPost,
}: {
  post: Post;
  fetchCommentsForPost?: (postId: string) => Promise<Comment[]>;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const canOpenComments = Boolean(fetchCommentsForPost);
  const dispatch = useAppDispatch();
  const likeState = useAppSelector((state) =>
    selectLikeState(state, "post", post.id)
  );
  const likesCount = likeState?.likesCount ?? post.likesCount;
  const isLiked = likeState?.isLiked ?? post.isLiked ?? false;

  useEffect(() => {
    dispatch(
      hydrateLike({
        targetType: "post",
        targetId: post.id,
        likesCount: post.likesCount,
        isLiked: post.isLiked,
      })
    );
  }, [dispatch, post.id, post.isLiked, post.likesCount]);

  useEffect(() => {
    if (!showComments || !fetchCommentsForPost || comments.length > 0) {
      return;
    }

    let isMounted = true;
    setIsLoadingComments(true);

    fetchCommentsForPost(post.id)
      .then((items) => {
        if (isMounted) {
          setComments(items);
          setCommentsCount(items.filter((item) => !item.parentCommentId).length);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingComments(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [comments.length, fetchCommentsForPost, post.id, showComments]);

  async function handleCommentSubmit(content: string) {
    const newComment = await createComment({
      postId: post.id,
      content,
    });

    setComments((currentComments) => [newComment, ...currentComments]);
    setCommentsCount((count) => count + 1);
    setShowComments(true);
  }

  async function handleReplySubmit(parentComment: Comment, content: string) {
    const newReply = await createComment({
      postId: post.id,
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
    <Stack gap="sm">
      <ContentCard
        type="post"
        author={post.author}
        content={post.content}
        media={post.media}
        createdAt={post.createdAt}
        likesCount={likesCount}
        commentsCount={commentsCount}
        isLiked={isLiked}
        onComment={
          canOpenComments ? () => setShowComments((value) => !value) : undefined
        }
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

      {canOpenComments && showComments && (
        <Stack gap="sm" pl={{ base: 0, sm: 56 }}>
          <CommentComposer onSubmit={handleCommentSubmit} />
          {isLoadingComments ? (
            <Group justify="center" py="sm">
              <Loader color="green" size="sm" />
            </Group>
          ) : (
            <CommentThread
              comments={comments}
              maxVisualDepth={2}
              onReplySubmit={handleReplySubmit}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}

export default function PostList({
  fetchPosts,
  fetchUpdatedPosts,
  fetchCommentsForPost,
  pageSize = 5,
  title = "Fil d'actualite",
}: PostListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    prependPost,
    loadMore,
  } = usePostList({
    fetchPosts,
    fetchUpdatedPosts,
    pageSize,
  });

  async function handleCreatePost() {
    const trimmedContent = postContent.trim();

    if (!trimmedContent || isCreatingPost) {
      return;
    }

    setIsCreatingPost(true);

    try {
      const post = await createPost({ content: trimmedContent });
      prependPost(post);
      setPostContent("");
      setIsCreatePostOpen(false);
    } finally {
      setIsCreatingPost(false);
    }
  }

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="green" />
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Modal
        opened={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        title="Ajouter un post"
        centered
        radius={8}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
      >
        <Stack gap="md">
          <Textarea
            value={postContent}
            onChange={(event) => setPostContent(event.currentTarget.value)}
            placeholder="Quoi de neuf ?"
            autosize
            minRows={4}
            maxRows={10}
          />
          <Group justify="flex-end">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setIsCreatePostOpen(false)}
            >
              Annuler
            </Button>
            <Button
              leftSection={<FiSend size={16} />}
              color="green"
              disabled={!postContent.trim()}
              loading={isCreatingPost}
              onClick={handleCreatePost}
            >
              Publier
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <Text fw={700} style={{ color: "var(--foreground)" }} size="lg">
          {title}
        </Text>
        <Button
          leftSection={<FiPlus size={16} />}
          variant="light"
          color="green"
          radius="xl"
          onClick={() => setIsCreatePostOpen(true)}
        >
          Ajouter un post
        </Button>
      </Group>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {posts.length === 0 ? (
        <Text style={{ color: "var(--muted-foreground)" }} ta="center" py="xl">
          Aucun post pour le moment.
        </Text>
      ) : (
        <AnimatedList delay={0} reverseOrder={false} className="gap-3">
          {posts.map((post) => (
            <PostFeedItem
              key={post.id}
              post={post}
              fetchCommentsForPost={fetchCommentsForPost}
            />
          ))}
        </AnimatedList>
      )}

      <div ref={loadMoreRef} aria-hidden="true" />

      {isLoadingMore && (
        <Group justify="center" py="md">
          <Loader color="green" size="sm" />
        </Group>
      )}

      {!hasMore && posts.length > 0 && (
        <Text style={{ color: "var(--muted-foreground)" }} ta="center" size="sm" py="sm">
          Vous avez atteint la fin du feed.
        </Text>
      )}
    </Stack>
  );
}
