"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/http-client";
import { useI18n } from "@/lib/i18n/client";
import type { Post } from "@/types/post";

export type PostPageParams = {
  limit: number;
  cursor?: string | null;
};

export type PostPage = {
  items: Post[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type FetchPostPage = (params: PostPageParams) => Promise<PostPage>;

type UsePostListOptions = {
  fetchPosts: FetchPostPage;
  fetchUpdatedPosts?: FetchPostPage;
  pageSize?: number;
};

export function usePostList({
  fetchPosts,
  fetchUpdatedPosts,
  pageSize = 5,
}: UsePostListOptions) {
  const { t } = useI18n();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      setIsLoading(true);
      setError(null);

      try {
        const page = await fetchPosts({ limit: pageSize });
        if (isMounted) {
          setPosts(page.items);
          setNextCursor(page.nextCursor);
          setHasMore(page.hasMore);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            t("post.loadError", {
              message: getApiErrorMessage(
                loadError,
                t("common.unknownError"),
                t("common.serverUnreachable")
              ),
            })
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [fetchPosts, pageSize, t]);

  const refresh = useCallback(async () => {
    const loader = fetchUpdatedPosts ?? fetchPosts;
    setIsRefreshing(true);
    setError(null);

    try {
      const page = await loader({ limit: pageSize });
      setPosts((currentPosts) => {
        const currentIds = new Set(currentPosts.map((post) => post.id));
        const newPosts = page.items.filter((post) => !currentIds.has(post.id));

        return [...newPosts, ...currentPosts];
      });
    } catch (refreshError) {
      setError(
        t("post.refreshError", {
          message: getApiErrorMessage(
            refreshError,
            t("common.unknownError"),
            t("common.serverUnreachable")
          ),
        })
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPosts, fetchUpdatedPosts, pageSize, t]);

  const prependPost = useCallback((post: Post) => {
    setPosts((currentPosts) => {
      if (currentPosts.some((currentPost) => currentPost.id === post.id)) {
        return currentPosts;
      }

      return [post, ...currentPosts];
    });
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await fetchPosts({ limit: pageSize, cursor: nextCursor });

      setPosts((currentPosts) => {
        const currentIds = new Set(currentPosts.map((post) => post.id));
        const nextItems = page.items.filter((post) => !currentIds.has(post.id));

        return [...currentPosts, ...nextItems];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (loadMoreError) {
      setError(
        t("post.loadMoreError", {
          message: getApiErrorMessage(
            loadMoreError,
            t("common.unknownError"),
            t("common.serverUnreachable")
          ),
        })
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPosts, hasMore, isLoadingMore, nextCursor, pageSize, t]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    error,
    refresh,
    prependPost,
    removePost,
    loadMore,
  };
}
