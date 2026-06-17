"use client";

import { Alert, Group, Loader } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import PostList from "@/components/posts/PostList";
import { fetchPostComments } from "@/lib/api/comment.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { fetchFeedPosts } from "@/lib/api/post.service";

export default function FeedList() {
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

        setUserId(
          currentUser.profile?.id_user ??
            currentUser.user?.id_user ??
            currentUser.auth.id
        );
      })
      .catch(() => {
        if (isMounted) {
          setError("Impossible de verifier l'utilisateur connecte.");
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
  }, []);

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
      <Alert color="red" variant="light">
        {error ?? "Utilisateur introuvable."}
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
