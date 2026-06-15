"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/types/comment";

type UseCommentListOptions = {
  fetchComments: () => Promise<Comment[]>;
};

export function useCommentList({ fetchComments }: UseCommentListOptions) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError("Impossible de charger les commentaires.");
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
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    error,
  };
}
