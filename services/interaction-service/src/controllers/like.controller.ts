import type { RequestHandler } from "express";

import {
  addCommentLike,
  addPostLike,
  countCommentLikes,
  countPostLikes,
  LikeError,
  removeCommentLike,
  removePostLike,
} from "../services/like.service.js";

function getUserId(body: Record<string, unknown>): string | null {
  const { userId } = body;
  return typeof userId === "string" && userId.trim() ? userId.trim() : null;
}

function getPostId(body: Record<string, unknown>): string | null {
  const { postId } = body;
  return typeof postId === "string" && postId.trim() ? postId.trim() : null;
}

function getParamId(params: Record<string, unknown>): string | null {
  const { targetId } = params;
  if (typeof targetId !== "string" || !targetId.trim()) {
    return null;
  }
  return targetId.trim();
}

export const addPostLikeHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req.body);
    const postId = getParamId(req.params);

    if (!userId) {
      throw new LikeError("userId est requis", 400);
    }

    if (!postId) {
      throw new LikeError("postId est requis", 400);
    }

    const like = await addPostLike(userId, postId);
    res.status(201).json(like);
  } catch (error) {
    next(error);
  }
};

export const removePostLikeHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getUserId(req.body);
    const postId = getParamId(req.params);

    if (!userId) {
      throw new LikeError("userId est requis", 400);
    }

    if (!postId) {
      throw new LikeError("postId est requis", 400);
    }

    await removePostLike(userId, postId);
    res.status(200).json({ message: "Like supprimé" });
  } catch (error) {
    next(error);
  }
};

export const countPostLikesHandler: RequestHandler = async (req, res, next) => {
  try {
    const postId = getParamId(req.params);

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
    const userId = getUserId(req.body);
    const commentId = getParamId(req.params);
    const postId = getPostId(req.body);

    if (!userId) {
      throw new LikeError("userId est requis", 400);
    }

    if (!commentId) {
      throw new LikeError("commentId est requis", 400);
    }

    if (!postId) {
      throw new LikeError("postId est requis", 400);
    }

    const like = await addCommentLike(userId, commentId, postId);
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
    const userId = getUserId(req.body);
    const commentId = getParamId(req.params);

    if (!userId) {
      throw new LikeError("userId est requis", 400);
    }

    if (!commentId) {
      throw new LikeError("commentId est requis", 400);
    }

    await removeCommentLike(userId, commentId);
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
    const commentId = getParamId(req.params);

    if (!commentId) {
      throw new LikeError("commentId est requis", 400);
    }

    const count = await countCommentLikes(commentId);
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};
