import { httpClient } from "./http-client";
import { getCurrentUserFromApi } from "./current-user.service";
import type { FetchPostPage, PostPage, PostPageParams } from "@/hooks/usePostList";
import type { Author, Media, Post } from "@/types/post";

type ApiPost = {
  id: string;
  authorId: string;
  content: string;
  author?: Author;
  tags?: string[];
  media?: Media[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  likers?: Author[];
  createdAt: string;
  updatedAt?: string;
};

type PostsResponse = {
  status: string;
  data: {
    posts: ApiPost[];
    nextCursor?: string | null;
    hasMore?: boolean;
  };
};

type PostResponse = {
  status: string;
  data: {
    post: ApiPost | null;
  };
};

type CreatePostInput = {
  content: string;
  tags?: string[];
  media?: Media[];
};

function mapApiPost(post: ApiPost, likesCount = 0, commentsCount = 0): Post {
  return {
    id: post.id,
    author: post.author ?? {
      id: post.authorId,
      name: `Utilisateur ${post.authorId.slice(0, 8)}`,
      username: post.authorId.slice(0, 12),
    },
    content: post.content,
    media: post.media ?? [],
    likesCount: post.likesCount ?? likesCount,
    commentsCount: post.commentsCount ?? commentsCount,
    isLiked: post.isLiked ?? false,
    likers: post.likers ?? [],
    createdAt: post.createdAt,
  };
}

async function mapPostsWithCounts(apiPosts: ApiPost[]) {
  return apiPosts.map((post) => mapApiPost(post));
}

function fallbackPage(items: Post[], params: PostPageParams): PostPage {
  return {
    items,
    nextCursor: items.at(-1)?.id ?? null,
    hasMore: items.length === params.limit,
  };
}

export const fetchFollowedUsersPosts: FetchPostPage = async (params) => {
  const { data } = await httpClient.get<PostsResponse>("/posts/all", {
    params: {
      limit: params.limit,
      cursor: params.cursor,
    },
  });
  const items = await mapPostsWithCounts(data.data.posts);

  return {
    items,
    nextCursor: data.data.nextCursor ?? fallbackPage(items, params).nextCursor,
    hasMore: data.data.hasMore ?? fallbackPage(items, params).hasMore,
  };
};

export const fetchFollowedUsersPostsWithNewItems = fetchFollowedUsersPosts;

export function fetchFeedPosts(_userId: string): FetchPostPage {
  return async (params) => {
    const { data } = await httpClient.get<PostsResponse>("/posts/feed", {
      params: {
        limit: params.limit,
        cursor: params.cursor,
      },
    });
    const items = await mapPostsWithCounts(data.data.posts);

    return {
      items,
      nextCursor: data.data.nextCursor ?? fallbackPage(items, params).nextCursor,
      hasMore: data.data.hasMore ?? fallbackPage(items, params).hasMore,
    };
  };
}

export function fetchUserPosts(userId: string): FetchPostPage {
  return async (params) => {
    const { data } = await httpClient.get<PostsResponse>("/posts", {
      params: {
        authorId: userId,
        limit: params.limit,
        cursor: params.cursor,
      },
    });
    const items = await mapPostsWithCounts(data.data.posts);

    return {
      items,
      nextCursor: data.data.nextCursor ?? fallbackPage(items, params).nextCursor,
      hasMore: data.data.hasMore ?? fallbackPage(items, params).hasMore,
    };
  };
}

export function fetchPostsByTag(tag: string): FetchPostPage {
  return async (params) => {
    const { data } = await httpClient.get<PostsResponse>(`/posts/tag/${encodeURIComponent(tag)}`, {
      params: {
        limit: params.limit,
        cursor: params.cursor,
      },
    });
    const items = await mapPostsWithCounts(data.data.posts);

    return {
      items,
      nextCursor: data.data.nextCursor ?? fallbackPage(items, params).nextCursor,
      hasMore: data.data.hasMore ?? fallbackPage(items, params).hasMore,
    };
  };
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  const { data } = await httpClient.get<PostResponse>(`/posts/${postId}`);

  if (!data.data.post) {
    return null;
  }

  return mapApiPost(data.data.post);
}

export async function createPost({ content, tags, media }: CreatePostInput): Promise<Post> {
  const currentUser = await getCurrentUserFromApi();
  const authorId =
    currentUser.profile?.id_user ?? currentUser.user?.id_user ?? currentUser.auth.id;

  const { data } = await httpClient.post<PostResponse>("/posts", {
    authorId,
    content,
    tags,
    media,
  });

  if (!data.data.post) {
    throw new Error("Post creation failed");
  }

  return mapApiPost(data.data.post);
}

export async function deletePost(postId: string): Promise<void> {
  await httpClient.delete(`/posts/${encodeURIComponent(postId)}`);
}
