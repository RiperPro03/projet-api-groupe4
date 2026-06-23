"use client";

import { useMemo } from "react";
import { Tabs } from "@mantine/core";
import CommentList from "@/components/comments/CommentList";
import PostList from "@/components/posts/PostList";
import { fetchUserComments } from "@/lib/api/comment.service";
import { fetchUserPosts } from "@/lib/api/post.service";
import { useI18n } from "@/lib/i18n/client";

type ProfileActivityTabsProps = {
  profileUserId: string;
  isOwnProfile?: boolean;
};

export default function ProfileActivityTabs({
  profileUserId,
  isOwnProfile = false,
}: ProfileActivityTabsProps) {
  const { t } = useI18n();
  const fetchPosts = useMemo(() => {
    return fetchUserPosts(profileUserId);
  }, [profileUserId]);

  const fetchComments = useMemo(() => {
    return () => fetchUserComments(profileUserId);
  }, [profileUserId]);

  return (
    <Tabs defaultValue="posts" color="green" keepMounted={false}>
      <Tabs.List grow>
        <Tabs.Tab value="posts">{t("post.tab")}</Tabs.Tab>
        <Tabs.Tab value="comments">{t("comment.tab")}</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="posts" pt="md">
        <PostList fetchPosts={fetchPosts} title={t("post.profileTitle")} showCreateButton={isOwnProfile} />
      </Tabs.Panel>

      <Tabs.Panel value="comments" pt="md">
        <CommentList fetchComments={fetchComments} />
      </Tabs.Panel>
    </Tabs>
  );
}
