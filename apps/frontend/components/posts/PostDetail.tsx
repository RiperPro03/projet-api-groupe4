"use client";

import { useEffect, useState } from "react";
import { Alert, Group, Loader, Stack, Text } from "@mantine/core";
import CommentComposer from "@/components/comments/CommentComposer";
import CommentThread from "@/components/comments/CommentThread";
import ContentCard from "@/components/feed/ContentCard";
import { fetchMockPostComments } from "@/lib/mock-comments";
import { fetchMockPostById } from "@/lib/mock-posts";
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
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadPostDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const [postItem, commentItems] = await Promise.all([
          fetchMockPostById(postId),
          fetchMockPostComments(postId),
        ]);

        if (isMounted) {
          setPost(postItem);
          setComments(commentItems);
          setLikesCount(postItem?.likesCount ?? 0);
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
  }, [postId]);

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

  function createLocalComment(
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

  async function handleCommentSubmit(content: string) {
    setComments((currentComments) => [
      createLocalComment(content),
      ...currentComments,
    ]);
  }

  async function handleReplySubmit(parentComment: Comment, content: string) {
    const newReply = createLocalComment(content, parentComment.id);

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
        onLike={() => setLikesCount((count) => count + 1)}
      />
      <CommentComposer onSubmit={handleCommentSubmit} />
      <CommentThread comments={comments} onReplySubmit={handleReplySubmit} />
    </Stack>
  );
}
