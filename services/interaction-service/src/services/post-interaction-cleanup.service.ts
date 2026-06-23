import { CommentLike } from "../models/comment-like.model.js";
import { Comment } from "../models/comment.model.js";
import { PostLike } from "../models/post-like.model.js";
import { CommentError } from "./comment.service.js";

export type PostInteractionCleanupResult = {
  commentsDeletedCount: number;
  postLikesDeletedCount: number;
  commentLikesDeletedCount: number;
};

function requireNonEmpty(value: string | undefined | null, fieldName: string) {
  const resolvedValue = typeof value === "string" ? value.trim() : "";

  if (!resolvedValue) {
    throw new CommentError(`${fieldName} est requis`, 400);
  }

  return resolvedValue;
}

export async function deletePostInteractions(
  postId: string
): Promise<PostInteractionCleanupResult> {
  const resolvedPostId = requireNonEmpty(postId, "postId");

  const [commentsResult, postLikesResult, commentLikesResult] =
    await Promise.all([
      Comment.deleteMany({ postId: resolvedPostId }),
      PostLike.deleteMany({ postId: resolvedPostId }),
      CommentLike.deleteMany({ postId: resolvedPostId }),
    ]);

  return {
    commentsDeletedCount: commentsResult.deletedCount ?? 0,
    postLikesDeletedCount: postLikesResult.deletedCount ?? 0,
    commentLikesDeletedCount: commentLikesResult.deletedCount ?? 0,
  };
}
