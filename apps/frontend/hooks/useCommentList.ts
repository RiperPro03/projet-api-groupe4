"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Comment } from "@/types/comment";

type UseCommentListOptions = {
  fetchComments: () => Promise<Comment[]>;
};

export function useCommentList({ fetchComments }: UseCommentListOptions) {
  const { t } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function removeComment(commentId: string) {
    setComments((currentComments) =>
      currentComments.filter((comment) => comment.id !== commentId)
    );
  }

  function restoreComment(comment: Comment) {
    setComments((currentComments) => {
      if (currentComments.some((currentComment) => currentComment.id === comment.id)) {
        return currentComments;
      }

      return [...currentComments, comment].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setIsLoading(true);
      setError(null);

      try {
        const items = await fetchComments();
        if (isMounted) {
          setComments(items);
        }
      } catch {
        if (isMounted) {
          setError(t("comment.loadError"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [fetchComments, t]);

  return {
    comments,
    isLoading,
    error,
    removeComment,
    restoreComment,
  };
}
