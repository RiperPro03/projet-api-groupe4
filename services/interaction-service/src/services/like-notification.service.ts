import { createLikeNotification } from "../clients/notification.client.js";
import { getPostAuthorId } from "../clients/post.client.js";
import { env } from "../config/env.js";
import { Comment } from "../models/comment.model.js";

function shouldSkipSelfLike(authorId: string, actorId: string): boolean {
  return (
    !env.debugAllowSelfLikeNotifications && authorId === actorId
  );
}

async function notifyPostLike(actorId: string, postId: string): Promise<void> {
  const authorId = await getPostAuthorId(postId);

  if (!authorId || shouldSkipSelfLike(authorId, actorId)) {
    return;
  }

  await createLikeNotification({
    recipientId: authorId,
    actorId,
    resourceType: "post",
    resourceId: postId,
  });
}

async function notifyCommentLike(
  actorId: string,
  commentId: string
): Promise<void> {
  const comment = await Comment.findById(commentId).select("authorId").lean();

  if (!comment?.authorId || shouldSkipSelfLike(comment.authorId, actorId)) {
    return;
  }

  await createLikeNotification({
    recipientId: comment.authorId,
    actorId,
    resourceType: "comment",
    resourceId: commentId,
  });
}

export function notifyPostLikeSafely(actorId: string, postId: string): void {
  void notifyPostLike(actorId, postId).catch((error) => {
    console.error("Failed to create post like notification:", error);
  });
}

export function notifyCommentLikeSafely(
  actorId: string,
  commentId: string
): void {
  void notifyCommentLike(actorId, commentId).catch((error) => {
    console.error("Failed to create comment like notification:", error);
  });
}
