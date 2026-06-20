import { buildServiceUrl } from "../config/services";
import { requestService } from "../utils/http-client";

type PostServicePost = {
  id: string;
  authorId: string;
  content: string;
  media?: {
    id: string;
    type: "image" | "video";
    url: string;
    alt?: string;
  }[];
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

type PostPageResponse = {
  status: string;
  message?: string;
  data: {
    posts: PostServicePost[];
    nextCursor: string | null;
    hasMore: boolean;
  };
};

type PostResponse = {
  status: string;
  message?: string;
  data: {
    post: PostServicePost | null;
  };
};

type FollowRecord = {
  follower_id?: string;
  following_id?: string;
  followerId?: string;
  followingId?: string;
};

type InteractionComment = {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

type AuthorProfile = {
  id_user?: string;
  username?: string;
  nickname?: string;
  url_photo?: string;
};

type Author = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
};

type CommentsResponse = {
  status: string;
  message?: string;
  data: {
    comments: InteractionComment[];
  };
};

type CountResponse = {
  count: number;
};

type LikeStatusResponse = {
  isLiked?: boolean;
  likedIds?: string[];
};

export type EnrichedComment = InteractionComment & {
  author: Author;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
};

export type EnrichedPost = PostServicePost & {
  author: Author;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
};

type PageParams = {
  limit: number;
  cursor?: string | null;
};

const getCount = async (url: string, params: Record<string, string>) => {
  const response = await requestService<CountResponse>("interactions", {
    method: "GET",
    url,
    params,
  });

  return response.data.count;
};

const getPostLikesCount = (postId: string) =>
  getCount(buildServiceUrl("interactions", "/posts/likes/count"), { postId });

const getCommentLikesCount = (commentId: string) =>
  getCount(buildServiceUrl("interactions", "/comments/likes/count"), {
    commentId,
  });

const getLikedIds = async (
  url: string,
  params: Record<string, string>
): Promise<Set<string>> => {
  const response = await requestService<LikeStatusResponse>("interactions", {
    method: "GET",
    url,
    params,
  });

  return new Set(response.data.likedIds ?? []);
};

const getLikedPostIds = (userId: string, postIds: string[]) =>
  getLikedIds(buildServiceUrl("interactions", "/posts/likes/status"), {
    userId,
    postIds: postIds.join(","),
  });

const getLikedCommentIds = (userId: string, commentIds: string[]) =>
  getLikedIds(buildServiceUrl("interactions", "/comments/likes/status"), {
    userId,
    commentIds: commentIds.join(","),
  });

const getCommentsByPost = async (postId: string) => {
  const response = await requestService<CommentsResponse>("interactions", {
    method: "GET",
    url: buildServiceUrl("interactions", "/comments"),
    params: { postId },
  });

  return response.data.data.comments;
};

const getProfileByUserId = async (userId: string) => {
  const response = await requestService<{ data?: AuthorProfile | null }>(
    "profiles",
    {
      method: "GET",
      url: buildServiceUrl("profiles", `/${encodeURIComponent(userId)}`),
    }
  );

  return response.data.data ?? null;
};

const getAuthorFallback = (authorId: string): Author => ({
  id: authorId,
  name: `Utilisateur ${authorId.slice(0, 8)}`,
  username: authorId.slice(0, 12),
});

const getAuthorsById = async (authorIds: string[]) => {
  const uniqueAuthorIds = Array.from(new Set(authorIds.filter(Boolean)));
  const entries = await Promise.all(
    uniqueAuthorIds.map(async (authorId): Promise<[string, Author]> => {
      const profile = await getProfileByUserId(authorId).catch(() => null);

      if (!profile) {
        return [authorId, getAuthorFallback(authorId)];
      }

      const username = profile.username?.trim() || authorId.slice(0, 12);
      const name = profile.nickname?.trim() || username;

      return [
        authorId,
        {
          id: profile.id_user ?? authorId,
          name,
          username,
          avatarUrl: profile.url_photo?.trim() || undefined,
        },
      ];
    })
  );

  return new Map(entries);
};

const withReplyCounts = (comments: InteractionComment[]) => {
  const replyCounts = new Map<string, number>();

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      replyCounts.set(
        comment.parentCommentId,
        (replyCounts.get(comment.parentCommentId) ?? 0) + 1
      );
    }
  });

  return replyCounts;
};

export const enrichComments = async (
  comments: InteractionComment[],
  viewerId: string
) => {
  const replyCounts = withReplyCounts(comments);
  const authors = await getAuthorsById(
    comments.map((comment) => comment.authorId)
  );
  const likedCommentIds = await getLikedCommentIds(
    viewerId,
    comments.map((comment) => comment.id)
  ).catch(() => new Set<string>());

  return Promise.all(
    comments.map(async (comment): Promise<EnrichedComment> => ({
      ...comment,
      author: authors.get(comment.authorId) ?? getAuthorFallback(comment.authorId),
      likesCount: await getCommentLikesCount(comment.id).catch(() => 0),
      repliesCount: replyCounts.get(comment.id) ?? 0,
      isLiked: likedCommentIds.has(comment.id),
    }))
  );
};

export const enrichPosts = async (posts: PostServicePost[], viewerId: string) => {
  const authors = await getAuthorsById(posts.map((post) => post.authorId));
  const likedPostIds = await getLikedPostIds(
    viewerId,
    posts.map((post) => post.id)
  ).catch(() => new Set<string>());

  return Promise.all(
    posts.map(async (post): Promise<EnrichedPost> => {
      const [likesCount, comments] = await Promise.all([
        getPostLikesCount(post.id).catch(() => 0),
        getCommentsByPost(post.id).catch(() => []),
      ]);

      return {
        ...post,
        author: authors.get(post.authorId) ?? getAuthorFallback(post.authorId),
        likesCount,
        commentsCount: comments.filter((comment) => !comment.parentCommentId)
          .length,
        isLiked: likedPostIds.has(post.id),
      };
    })
  );
};

export const getFollowingIds = async (userId: string) => {
  const response = await requestService<FollowRecord[]>("follows", {
    method: "GET",
    url: buildServiceUrl("follows", "/following"),
    params: { followerId: userId },
  });

  return response.data
    .map((record) => record.following_id ?? record.followingId ?? null)
    .filter((id): id is string => Boolean(id));
};

export const getPostPage = async (
  path: string,
  params: Record<string, string | number | null | undefined>,
  viewerId: string
) => {
  const response = await requestService<PostPageResponse>("posts", {
    method: "GET",
    url: buildServiceUrl("posts", path),
    params,
  });
  const posts = await enrichPosts(response.data.data.posts, viewerId);

  return {
    ...response.data,
    data: {
      ...response.data.data,
      posts,
    },
  };
};

export const getFeedPostPage = async (userId: string, params: PageParams) => {
  const followingIds = await getFollowingIds(userId).catch(() => []);
  const authorIds = Array.from(new Set([userId, ...followingIds]));

  return getPostPage("/feed", {
    authorIds: authorIds.join(","),
    limit: params.limit,
    cursor: params.cursor,
  }, userId);
};

export const getPost = async (postId: string, viewerId: string) => {
  const response = await requestService<PostResponse>("posts", {
    method: "GET",
    url: buildServiceUrl("posts", `/${postId}`),
  });
  const post = response.data.data.post;

  return {
    ...response.data,
    data: {
      post: post ? (await enrichPosts([post], viewerId))[0] : null,
    },
  };
};

export const getComments = async (
  params: Record<string, string | undefined>,
  viewerId: string
) => {
  const response = await requestService<CommentsResponse>("interactions", {
    method: "GET",
    url: buildServiceUrl("interactions", "/comments"),
    params,
  });
  const comments = await enrichComments(response.data.data.comments, viewerId);

  return {
    ...response.data,
    data: {
      comments,
    },
  };
};

export const getCommentReplies = async (commentId: string, viewerId: string) => {
  const response = await requestService<CommentsResponse>("interactions", {
    method: "GET",
    url: buildServiceUrl("interactions", `/comments/${commentId}/replies`),
  });
  const comments = await enrichComments(response.data.data.comments, viewerId);

  return {
    ...response.data,
    data: {
      comments,
    },
  };
};
