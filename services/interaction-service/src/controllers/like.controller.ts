import type { Request, RequestHandler } from "express";

import {
  addCommentLike,
  addPostLike,
  countCommentLikes,
  countPostLikes,
  LikeError,
  removeCommentLike,
  removePostLike,
} from "../services/like.service.js";

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

function getPostLikeBody(
  req: Request
): { userId: string; postId: string } | null {
  const userId = getTrimmedString(req.body?.userId);
  const postId = getTrimmedString(req.body?.postId);

  if (!userId || !postId) {
    return null;
  }

  return { userId, postId };
}

function getCommentLikeBody(
  req: Request
): { userId: string; commentId: string; postId: string } | null {
  const userId = getTrimmedString(req.body?.userId);
  const commentId = getTrimmedString(req.body?.commentId);
  const postId = getTrimmedString(req.body?.postId);

  if (!userId || !commentId || !postId) {
    return null;
  }

  return { userId, commentId, postId };
}

function getCommentUnlikeBody(
  req: Request
): { userId: string; commentId: string } | null {
  const userId = getTrimmedString(req.body?.userId);
  const commentId = getTrimmedString(req.body?.commentId);

  if (!userId || !commentId) {
    return null;
  }

  return { userId, commentId };
}

export const addPostLikeHandler: RequestHandler = async (req, res, next) => {
  try {
    const body = getPostLikeBody(req);
    if (!body) {
      throw new LikeError("userId et postId sont requis", 400);
    }

    const like = await addPostLike(body.userId, body.postId);
    res.status(201).json(like);
  } catch (error) {
    next(error);
  }
};

export const removePostLikeHandler: RequestHandler = async (req, res, next) => {
  try {
    const body = getPostLikeBody(req);
    if (!body) {
      throw new LikeError("userId et postId sont requis", 400);
    }

    await removePostLike(body.userId, body.postId);
    res.status(200).json({ message: "Like supprimé" });
  } catch (error) {
    next(error);
  }
};

export const countPostLikesHandler: RequestHandler = async (req, res, next) => {
  try {
    const postId = getField(req, "postId");
    if (!postId) {
      throw new LikeError("postId est requis", 400);
    }

    const count = await countPostLikes(postId);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

export const addCommentLikeHandler: RequestHandler = async (req, res, next) => {
  try {
    const body = getCommentLikeBody(req);
    if (!body) {
      throw new LikeError("userId, commentId et postId sont requis", 400);
    }

    const like = await addCommentLike(body.userId, body.commentId, body.postId);
    res.status(201).json(like);
  } catch (error) {
    next(error);
  }
};

export const removeCommentLikeHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const body = getCommentUnlikeBody(req);
    if (!body) {
      throw new LikeError("userId et commentId sont requis", 400);
    }

    await removeCommentLike(body.userId, body.commentId);
    res.status(200).json({ message: "Like supprimé" });
  } catch (error) {
    next(error);
  }
};

export const countCommentLikesHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const commentId = getField(req, "commentId");
    if (!commentId) {
      throw new LikeError("commentId est requis", 400);
    }

    const count = await countCommentLikes(commentId);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};
