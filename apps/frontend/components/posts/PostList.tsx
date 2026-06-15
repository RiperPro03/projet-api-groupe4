"use client";

import { Alert, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import CommentComposer from "@/components/comments/CommentComposer";
import CommentThread from "@/components/comments/CommentThread";
import { AnimatedList } from "@/components/ui/animated-list";
import { usePostList, type FetchPostPage } from "@/hooks/usePostList";
import type { Comment } from "@/types/comment";
import type { Post } from "@/types/post";
import ContentCard from "@/components/feed/ContentCard";

type PostListProps = {
  fetchPosts: FetchPostPage;
  fetchUpdatedPosts?: FetchPostPage;
  fetchCommentsForPost?: (postId: string) => Promise<Comment[]>;
  pageSize?: number;
};

function createLocalComment(
  postId: string,
  content: string,
  parentCommentId: string | null = null
): Comment {
  return {
    id: `local-comment-${Date.now()}`,
    id_post: postId,
    parentCommentId,
    author: {
      id: "current-user",
      name: "Vous",
      username: "vous",
    },
    content,
    media: [],
    likesCount: 0,
    repliesCount: 0,
    createdAt: new Date().toISOString(),
  };
}

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
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);

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
    const newComment = createLocalComment(post.id, content);
    setComments((currentComments) => [newComment, ...currentComments]);
    setCommentsCount((count) => count + 1);
    setShowComments(true);
  }

  async function handleReplySubmit(parentComment: Comment, content: string) {
    const newReply = createLocalComment(post.id, content, parentComment.id);

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
        onComment={() => setShowComments((value) => !value)}
        onLike={() => setLikesCount((count) => count + 1)}
      />

      {showComments && (
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
}: PostListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    error,
    refresh,
    loadMore,
  } = usePostList({
    fetchPosts,
    fetchUpdatedPosts,
    pageSize,
  });

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
      <Group justify="space-between" align="center">
        <Text fw={700} c="white" size="lg">
          Fil d'actualite
        </Text>
        <Button
          leftSection={<FiRefreshCw size={16} />}
          variant="light"
          color="green"
          radius="xl"
          loading={isRefreshing}
          onClick={refresh}
        >
          Recharger
        </Button>
      </Group>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {posts.length === 0 ? (
        <Text c="gray.5" ta="center" py="xl">
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
        <Text c="gray.6" ta="center" size="sm" py="sm">
          Vous avez atteint la fin du feed.
        </Text>
      )}
    </Stack>
  );
}
