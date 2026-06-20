"use client";

import { Alert, Group, Loader } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import PostList from "@/components/posts/PostList";
import { fetchPostComments } from "@/lib/api/comment.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { fetchFeedPosts } from "@/lib/api/post.service";
import { resolveCurrentUserId } from "@/lib/current-user.shared";
import { useI18n } from "@/lib/i18n/client";

export default function FeedList() {
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserFromApi()
      .then((currentUser) => {
        if (!isMounted) {
          return;
        }

        setUserId(resolveCurrentUserId(currentUser));
      })
      .catch(() => {
        if (isMounted) {
          setError(t("api.currentUserVerifyError"));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const fetchPosts = useMemo(() => {
    return userId ? fetchFeedPosts(userId) : null;
  }, [userId]);

  if (isLoadingUser) {
    return (
      <Group justify="center" py="xl">
        <Loader color="green" />
      </Group>
    );
  }

  if (error || !fetchPosts) {
    return (
      <Alert
        variant="light"
        style={{
          backgroundColor: "color-mix(in oklch, var(--destructive) 12%, transparent)",
          borderColor: "color-mix(in oklch, var(--destructive) 35%, transparent)",
          color: "var(--destructive)",
        }}
      >
        {error ?? t("api.userNotFound")}
      </Alert>
    );
  }

  return (
    <PostList
      fetchPosts={fetchPosts}
      fetchUpdatedPosts={fetchPosts}
      fetchCommentsForPost={fetchPostComments}
    />
  );
}
