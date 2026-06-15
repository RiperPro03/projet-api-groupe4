import { Comment } from "../models/comment.model.js";

/** Erreur métier avec un code HTTP associé (utilisée par le controller). */
export class CommentError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "CommentError";
  }
}

const NOT_DELETED = { deletedAt: null };

function requireNonEmpty(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new CommentError(`${fieldName} est requis`, 400);
  }
  return trimmed;
}

async function findActiveComment(postId: string, commentId: string) {
  const comment = await Comment.findOne({
    _id: commentId,
    postId,
    ...NOT_DELETED,
  });

  if (!comment) {
    throw new CommentError("Commentaire introuvable", 404);
  }

  return comment;
}

/** Crée un commentaire racine (Fx7) ou une réponse (Fx8). */
export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentCommentId?: string | null
) {
  const resolvedPostId = requireNonEmpty(postId, "postId");
  const resolvedUserId = requireNonEmpty(userId, "userId");
  const resolvedContent = requireNonEmpty(content, "content");

  const resolvedParentId = parentCommentId?.trim() || null;

  if (resolvedParentId) {
    const parent = await Comment.findOne({
      _id: resolvedParentId,
      postId: resolvedPostId,
      ...NOT_DELETED,
    });

    if (!parent) {
      throw new CommentError("Commentaire parent introuvable", 404);
    }

    if (parent.parentCommentId) {
      throw new CommentError(
        "Impossible de répondre à une réponse",
        400
      );
    }
  }

  return Comment.create({
    postId: resolvedPostId,
    userId: resolvedUserId,
    content: resolvedContent,
    parentCommentId: resolvedParentId,
  });
}

/** Modifie un commentaire (auteur uniquement). */
export async function updateComment(
  postId: string,
  commentId: string,
  userId: string,
  content: string
) {
  const resolvedPostId = requireNonEmpty(postId, "postId");
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");
  const resolvedUserId = requireNonEmpty(userId, "userId");
  const resolvedContent = requireNonEmpty(content, "content");

  const comment = await findActiveComment(resolvedPostId, resolvedCommentId);

  if (comment.userId !== resolvedUserId) {
    throw new CommentError("Action non autorisée", 403);
  }

  comment.content = resolvedContent;
  await comment.save();

  return comment;
}

/** Supprime un commentaire (soft delete, auteur uniquement). */
export async function deleteComment(
  postId: string,
  commentId: string,
  userId: string
): Promise<void> {
  const resolvedPostId = requireNonEmpty(postId, "postId");
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");
  const resolvedUserId = requireNonEmpty(userId, "userId");

  const comment = await findActiveComment(resolvedPostId, resolvedCommentId);

  if (comment.userId !== resolvedUserId) {
    throw new CommentError("Action non autorisée", 403);
  }

  comment.deletedAt = new Date();
  await comment.save();
}

/** Liste les commentaires d'un post (racines ou réponses selon parentCommentId). */
export async function listComments(
  postId: string,
  parentCommentId?: string | null
) {
  const resolvedPostId = requireNonEmpty(postId, "postId");
  const resolvedParentId = parentCommentId?.trim() || null;

  const filter: Record<string, unknown> = {
    postId: resolvedPostId,
    ...NOT_DELETED,
  };

  if (resolvedParentId) {
    filter.parentCommentId = resolvedParentId;
  } else {
    filter.parentCommentId = null;
  }

  return Comment.find(filter).sort({ createdAt: 1 });
}
