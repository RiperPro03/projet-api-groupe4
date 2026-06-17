import { getCurrentUserFromApi } from "./current-user.service";
import { httpClient } from "./http-client";
import type { Comment } from "@/types/comment";
import type { Author } from "@/types/post";

type ApiComment = {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId?: string | null;
  content: string;
  author?: Author;
  likesCount?: number;
  repliesCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

type CommentsResponse = {
  status: string;
  data: {
    comments: ApiComment[];
  };
};

type CommentResponse = {
  status: string;
  data: {
    comment: ApiComment;
  };
};

function mapApiComment(comment: ApiComment, likesCount = 0): Comment {
  return {
    id: comment.id,
    id_post: comment.postId,
    parentCommentId: comment.parentCommentId ?? null,
    author: comment.author ?? {
      id: comment.authorId,
      name: `Utilisateur ${comment.authorId.slice(0, 8)}`,
      username: comment.authorId.slice(0, 12),
    },
    content: comment.content,
    media: [],
    likesCount: comment.likesCount ?? likesCount,
    repliesCount: comment.repliesCount ?? 0,
    isLiked: comment.isLiked ?? false,
    createdAt: comment.createdAt,
  };
}

function withReplyCounts(comments: Comment[]) {
  const replyCounts = new Map<string, number>();

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      replyCounts.set(
        comment.parentCommentId,
        (replyCounts.get(comment.parentCommentId) ?? 0) + 1
      );
    }
  });

  return comments.map((comment) => ({
    ...comment,
    repliesCount: replyCounts.get(comment.id) ?? comment.repliesCount,
  }));
}

async function mapCommentsWithCounts(apiComments: ApiComment[]) {
  const comments = apiComments.map((comment) => mapApiComment(comment));

  return withReplyCounts(comments);
}

export async function fetchPostComments(postId: string): Promise<Comment[]> {
  const { data } = await httpClient.get<CommentsResponse>("/comments", {
    params: { postId },
  });

  return mapCommentsWithCounts(data.data.comments);
}

export async function fetchUserComments(userId: string): Promise<Comment[]> {
  const { data } = await httpClient.get<CommentsResponse>("/comments", {
    params: { authorId: userId },
  });

  return mapCommentsWithCounts(data.data.comments);
}

export async function fetchCommentReplies(commentId: string): Promise<Comment[]> {
  const { data } = await httpClient.get<CommentsResponse>(
    `/comments/${commentId}/replies`
  );

  return mapCommentsWithCounts(data.data.comments);
}

export async function createComment({
  postId,
  content,
  parentCommentId = null,
}: {
  postId: string;
  content: string;
  parentCommentId?: string | null;
}) {
  const currentUser = await getCurrentUserFromApi();
  const authorId =
    currentUser.profile?.id_user ?? currentUser.user?.id_user ?? currentUser.auth.id;

  const { data } = await httpClient.post<CommentResponse>("/comments", {
    postId,
    authorId,
    content,
    parentCommentId,
  });

  return mapApiComment(data.data.comment);
}
