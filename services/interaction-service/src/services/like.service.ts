import { CommentLike } from "../models/comment-like.model.js";
import { PostLike } from "../models/post-like.model.js";

/** Erreur métier avec un code HTTP associé (utilisée par le controller). */
export class LikeError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "LikeError";
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

function requireNonEmpty(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new LikeError(`${fieldName} est requis`, 400);
  }
  return trimmed;
}

async function createLike<T>(
  createFn: () => Promise<T>
): Promise<T> {
  try {
    return await createFn();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new LikeError("Ce like existe déjà", 409);
    }
    throw error;
  }
}

/** Ajoute un like sur un post. */
export async function addPostLike(userId: string, postId: string) {
  const resolvedUserId = requireNonEmpty(userId, "userId");
  const resolvedPostId = requireNonEmpty(postId, "postId");

  return createLike(() =>
    PostLike.create({
      userId: resolvedUserId,
      postId: resolvedPostId,
    })
  );
}

/** Retire un like sur un post. */
export async function removePostLike(
  userId: string,
  postId: string
): Promise<void> {
  const resolvedUserId = requireNonEmpty(userId, "userId");
  const resolvedPostId = requireNonEmpty(postId, "postId");

  const deleted = await PostLike.findOneAndDelete({
    userId: resolvedUserId,
    postId: resolvedPostId,
  });

  if (!deleted) {
    throw new LikeError("Like introuvable", 404);
  }
}

/** Compte les likes d'un post. */
export async function countPostLikes(postId: string): Promise<number> {
  const resolvedPostId = requireNonEmpty(postId, "postId");

  return PostLike.countDocuments({ postId: resolvedPostId });
}

/** Ajoute un like sur un commentaire (y compris une réponse, traitée comme commentaire enfant). */
export async function addCommentLike(
  userId: string,
  commentId: string,
  postId: string
) {
  const resolvedUserId = requireNonEmpty(userId, "userId");
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");
  const resolvedPostId = requireNonEmpty(postId, "postId");

  return createLike(() =>
    CommentLike.create({
      userId: resolvedUserId,
      commentId: resolvedCommentId,
      postId: resolvedPostId,
    })
  );
}

/** Retire un like sur un commentaire. */
export async function removeCommentLike(
  userId: string,
  commentId: string
): Promise<void> {
  const resolvedUserId = requireNonEmpty(userId, "userId");
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");

  const deleted = await CommentLike.findOneAndDelete({
    userId: resolvedUserId,
    commentId: resolvedCommentId,
  });

  if (!deleted) {
    throw new LikeError("Like introuvable", 404);
  }
}

/** Compte les likes d'un commentaire. */
export async function countCommentLikes(commentId: string): Promise<number> {
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");

  return CommentLike.countDocuments({ commentId: resolvedCommentId });
}
