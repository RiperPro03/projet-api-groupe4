import { Comment } from "../models/comment.model.js";
import type {
  CommentResponse,
  CreateCommentInput,
} from "../types/comment.types.js";

export class CommentError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
    this.name = "CommentError";
  }
}

function requireNonEmpty(value: string | undefined | null, fieldName: string) {
  const resolvedValue = typeof value === "string" ? value.trim() : "";

  if (!resolvedValue) {
    throw new CommentError(`${fieldName} est requis`, 400);
  }

  return resolvedValue;
}

function mapComment(comment: {
  _id: unknown;
  postId: string;
  authorId: string;
  parentCommentId?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}): CommentResponse {
  return {
    id: String(comment._id),
    postId: comment.postId,
    authorId: comment.authorId,
    parentCommentId: comment.parentCommentId ?? null,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    deletedAt: comment.deletedAt,
  };
}

export async function createComment(
  input: CreateCommentInput
): Promise<CommentResponse> {
  const postId = requireNonEmpty(input.postId, "postId");
  const authorId = requireNonEmpty(input.authorId, "authorId");
  const content = requireNonEmpty(input.content, "content");
  const parentCommentId =
    typeof input.parentCommentId === "string" && input.parentCommentId.trim()
      ? input.parentCommentId.trim()
      : null;

  const comment = await Comment.create({
    postId,
    authorId,
    parentCommentId,
    content,
  });

  return mapComment(comment);
}

export async function getCommentsByPost(
  postId: string
): Promise<CommentResponse[]> {
  const resolvedPostId = requireNonEmpty(postId, "postId");
  const comments = await Comment.find({
    postId: resolvedPostId,
    deletedAt: null,
  })
    .sort({ createdAt: 1 })
    .lean();

  return comments.map(mapComment);
}

export async function getCommentsByAuthor(
  authorId: string
): Promise<CommentResponse[]> {
  const resolvedAuthorId = requireNonEmpty(authorId, "authorId");
  const comments = await Comment.find({
    authorId: resolvedAuthorId,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .lean();

  return comments.map(mapComment);
}

export async function getCommentReplies(
  commentId: string
): Promise<CommentResponse[]> {
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");
  const comments = await Comment.find({
    parentCommentId: resolvedCommentId,
    deletedAt: null,
  })
    .sort({ createdAt: 1 })
    .lean();

  return comments.map(mapComment);
}

export async function getCommentById(
  commentId: string
): Promise<CommentResponse> {
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");
  const comment = await Comment.findOne({
    _id: resolvedCommentId,
    deletedAt: null,
  }).lean();

  if (!comment) {
    throw new CommentError("Commentaire introuvable", 404);
  }

  return mapComment(comment);
}

export async function softDeleteComment(
  commentId: string,
  requesterId?: string | null
): Promise<CommentResponse> {
  const resolvedCommentId = requireNonEmpty(commentId, "commentId");
  const comment = await Comment.findOne({
    _id: resolvedCommentId,
    deletedAt: null,
  });

  if (!comment) {
    throw new CommentError("Commentaire introuvable", 404);
  }

  if (requesterId && comment.authorId !== requesterId) {
    throw new CommentError("Forbidden", 403);
  }

  comment.deletedAt = new Date();
  await comment.save();

  return mapComment(comment);
}
