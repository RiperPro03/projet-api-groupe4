"use client";

import { useMemo } from "react";
import { Tabs } from "@mantine/core";
import CommentList from "@/components/comments/CommentList";
import PostList from "@/components/posts/PostList";
import { fetchUserComments } from "@/lib/api/comment.service";
import { fetchUserPosts } from "@/lib/api/post.service";

type ProfileActivityTabsProps = {
  profileUserId: string;
};

export default function ProfileActivityTabs({
  profileUserId,
}: ProfileActivityTabsProps) {
  const fetchPosts = useMemo(() => {
    return fetchUserPosts(profileUserId);
  }, [profileUserId]);

  const fetchComments = useMemo(() => {
    return () => fetchUserComments(profileUserId);
  }, [profileUserId]);

  return (
    <Tabs defaultValue="posts" color="green" keepMounted={false}>
      <Tabs.List grow>
        <Tabs.Tab value="posts">Posts</Tabs.Tab>
        <Tabs.Tab value="comments">Commentaires</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="posts" pt="md">
        <PostList fetchPosts={fetchPosts} title="Posts du profil" />
      </Tabs.Panel>

      <Tabs.Panel value="comments" pt="md">
        <CommentList fetchComments={fetchComments} />
      </Tabs.Panel>
    </Tabs>
  );
}
