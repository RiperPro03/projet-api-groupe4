"use client";

import { Alert, Group, Loader, Stack, Text } from "@mantine/core";
import { AnimatedList } from "@/components/ui/animated-list";
import ContentCard from "@/components/feed/ContentCard";
import { useCommentList } from "@/hooks/useCommentList";
import type { Comment } from "@/types/comment";

type CommentListProps = {
  fetchComments: () => Promise<Comment[]>;
};

export default function CommentList({ fetchComments }: CommentListProps) {
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
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {comments.length === 0 ? (
        <Text c="gray.5" ta="center" py="xl">
          Aucun commentaire pour le moment.
        </Text>
      ) : (
        <AnimatedList delay={120} className="gap-3">
          {[...comments].reverse().map((comment) => (
            <ContentCard
              key={comment.id}
              type="comment"
              author={comment.author}
              content={comment.content}
              media={comment.media}
              createdAt={comment.createdAt}
              likesCount={comment.likesCount}
              repliesCount={comment.repliesCount}
              isReply={Boolean(comment.parentCommentId)}
            />
          ))}
        </AnimatedList>
      )}
    </Stack>
  );
}
