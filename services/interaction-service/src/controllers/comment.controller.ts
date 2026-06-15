import type { Request, RequestHandler } from "express";

import {
  CommentError,
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from "../services/comment.service.js";

function getTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getField(req: Request, fieldName: string): string | null {
  const fromBody = getTrimmedString(req.body?.[fieldName]);
  if (fromBody) {
    return fromBody;
  }

  return getTrimmedString(req.query[fieldName]);
}

function getCreateCommentBody(
  req: Request
): { userId: string; content: string; parentCommentId?: string } | null {
  const userId = getTrimmedString(req.body?.userId);
  const content = getTrimmedString(req.body?.content);
  const parentCommentId = getTrimmedString(req.body?.parentCommentId);

  if (!userId || !content) {
    return null;
  }

  return parentCommentId
    ? { userId, content, parentCommentId }
    : { userId, content };
}

function getUpdateCommentBody(
  req: Request
): { userId: string; content: string } | null {
  const userId = getTrimmedString(req.body?.userId);
  const content = getTrimmedString(req.body?.content);

  if (!userId || !content) {
    return null;
  }

  return { userId, content };
}

function getDeleteCommentBody(req: Request): { userId: string } | null {
  const userId = getTrimmedString(req.body?.userId);

  if (!userId) {
    return null;
  }

  return { userId };
}

export const createCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const postId = getTrimmedString(req.params.postId);
    if (!postId) {
      throw new CommentError("postId est requis", 400);
    }

    const body = getCreateCommentBody(req);
    if (!body) {
      throw new CommentError("userId et content sont requis", 400);
    }

    const comment = await createComment(
      postId,
      body.userId,
      body.content,
      body.parentCommentId
    );
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const updateCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const postId = getTrimmedString(req.params.postId);
    const commentId = getTrimmedString(req.params.commentId);
    if (!postId || !commentId) {
      throw new CommentError("postId et commentId sont requis", 400);
    }

    const body = getUpdateCommentBody(req);
    if (!body) {
      throw new CommentError("userId et content sont requis", 400);
    }

    const comment = await updateComment(
      postId,
      commentId,
      body.userId,
      body.content
    );
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

export const deleteCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const postId = getTrimmedString(req.params.postId);
    const commentId = getTrimmedString(req.params.commentId);
    if (!postId || !commentId) {
      throw new CommentError("postId et commentId sont requis", 400);
    }

    const body = getDeleteCommentBody(req);
    if (!body) {
      throw new CommentError("userId est requis", 400);
    }

    await deleteComment(postId, commentId, body.userId);
    res.status(200).json({ message: "Commentaire supprimé" });
  } catch (error) {
    next(error);
  }
};

export const listCommentsHandler: RequestHandler = async (req, res, next) => {
  try {
    const postId = getTrimmedString(req.params.postId);
    if (!postId) {
      throw new CommentError("postId est requis", 400);
    }

    const parentCommentId = getField(req, "parentCommentId");
    const comments = await listComments(postId, parentCommentId);
    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};
