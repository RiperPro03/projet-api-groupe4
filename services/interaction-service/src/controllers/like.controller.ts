import type { Request, RequestHandler } from "express";

import {
  addCommentLike,
  addPostLike,
  countCommentLikes,
  countPostLikes,
  hasCommentLike,
  hasPostLike,
  LikeError,
  listLikedCommentIds,
  listLikedPostIds,
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

function getListField(req: Request, fieldName: string): string[] {
  const value = req.query[fieldName] ?? req.body?.[fieldName];

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      typeof item === "string" ? item.split(",") : []
    );
  }

  if (typeof value === "string") {
    return value.split(",");
  }

  return [];
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

export const hasPostLikeHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = getField(req, "userId");
    const postIds = getListField(req, "postIds");
    const postId = getField(req, "postId");

    if (!userId || (!postId && postIds.length === 0)) {
      throw new LikeError("userId et postId sont requis", 400);
    }

    if (postIds.length > 0) {
      const likedIds = await listLikedPostIds(userId, postIds);
      res.status(200).json({ likedIds });
      return;
    }

    if (!postId) {
      throw new LikeError("postId est requis", 400);
    }

    const isLiked = await hasPostLike(userId, postId);
    res.status(200).json({ isLiked });
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

export const hasCommentLikeHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const userId = getField(req, "userId");
    const commentIds = getListField(req, "commentIds");
    const commentId = getField(req, "commentId");

    if (!userId || (!commentId && commentIds.length === 0)) {
      throw new LikeError("userId et commentId sont requis", 400);
    }

    if (commentIds.length > 0) {
      const likedIds = await listLikedCommentIds(userId, commentIds);
      res.status(200).json({ likedIds });
      return;
    }

    if (!commentId) {
      throw new LikeError("commentId est requis", 400);
    }

    const isLiked = await hasCommentLike(userId, commentId);
    res.status(200).json({ isLiked });
  } catch (error) {
    next(error);
  }
};
