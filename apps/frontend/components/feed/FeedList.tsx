"use client";

import PostList from "@/components/posts/PostList";
import {
  fetchMockFollowedUsersPosts,
  fetchMockFollowedUsersPostsWithNewItems,
} from "@/lib/mock-posts";
import { fetchMockPostComments } from "@/lib/mock-comments";

export default function FeedList() {
  return (
    <PostList
      fetchPosts={fetchMockFollowedUsersPosts}
      fetchUpdatedPosts={fetchMockFollowedUsersPostsWithNewItems}
      fetchCommentsForPost={fetchMockPostComments}
    />
  );
}
