"use client";

import { useMemo } from "react";
import { Tabs } from "@mantine/core";
import CommentList from "@/components/comments/CommentList";
import PostList from "@/components/posts/PostList";
import { fetchMockUserComments } from "@/lib/mock-comments";
import { fetchMockUserPosts } from "@/lib/mock-posts";

type ProfileActivityTabsProps = {
  userId: string;
};

export default function ProfileActivityTabs({
  userId,
}: ProfileActivityTabsProps) {
  const fetchPosts = useMemo(() => {
    return (params: Parameters<typeof fetchMockUserPosts>[1]) =>
      fetchMockUserPosts(userId, params);
  }, [userId]);

  const fetchComments = useMemo(() => {
    return () => fetchMockUserComments(userId);
  }, [userId]);

  return (
    <Tabs defaultValue="posts" color="green" keepMounted={false}>
      <Tabs.List grow>
        <Tabs.Tab value="posts">Posts</Tabs.Tab>
        <Tabs.Tab value="comments">Commentaires</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="posts" pt="md">
        <PostList fetchPosts={fetchPosts} />
      </Tabs.Panel>

      <Tabs.Panel value="comments" pt="md">
        <CommentList fetchComments={fetchComments} />
      </Tabs.Panel>
    </Tabs>
  );
}
