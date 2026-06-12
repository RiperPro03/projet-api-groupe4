import type { Request, RequestHandler } from "express";

import type { TargetType } from "../models/like.model.js";
import {
  addLike,
  countLikes,
  LikeError,
  removeLike,
} from "../services/like.service.js";

function getUserId(req: Request): string | null {
  const { userId } = req.body;
  return typeof userId === "string" && userId.trim() ? userId.trim() : null;
}

function getPostId(req: Request): string | undefined {
  const { postId } = req.body;
  return typeof postId === "string" && postId.trim()
    ? postId.trim()
    : undefined;
}

function getTargetId(req: Request): string | null {
  const { targetId } = req.params;
  return typeof targetId === "string" && targetId.trim()
    ? targetId.trim()
    : null;
}

function createLikeHandlers(targetType: TargetType) {
  const addLikeHandler: RequestHandler = async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const targetId = getTargetId(req);

      if (!userId) {
        throw new LikeError("userId est requis", 400);
      }

      if (!targetId) {
        throw new LikeError("targetId est requis", 400);
      }

      const like = await addLike(
        userId,
        targetType,
        targetId,
        getPostId(req)
      );
      res.status(201).json(like);
    } catch (error) {
      next(error);
    }
  };

  const removeLikeHandler: RequestHandler = async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const targetId = getTargetId(req);

      if (!userId) {
        throw new LikeError("userId est requis", 400);
      }

      if (!targetId) {
        throw new LikeError("targetId est requis", 400);
      }

      await removeLike(userId, targetType, targetId);
      res.status(200).json({ message: "Like supprimé" });
    } catch (error) {
      next(error);
    }
  };

  const countLikesHandler: RequestHandler = async (req, res, next) => {
    try {
      const targetId = getTargetId(req);

      if (!targetId) {
        throw new LikeError("targetId est requis", 400);
      }

      const count = await countLikes(targetType, targetId);
      res.status(200).json({ count });
    } catch (error) {
      next(error);
    }
  };

  return { addLikeHandler, removeLikeHandler, countLikesHandler };
}

const postHandlers = createLikeHandlers("post");
const commentHandlers = createLikeHandlers("comment");
const replyHandlers = createLikeHandlers("reply");

export const addPostLikeHandler = postHandlers.addLikeHandler;
export const removePostLikeHandler = postHandlers.removeLikeHandler;
export const countPostLikesHandler = postHandlers.countLikesHandler;

export const addCommentLikeHandler = commentHandlers.addLikeHandler;
export const removeCommentLikeHandler = commentHandlers.removeLikeHandler;
export const countCommentLikesHandler = commentHandlers.countLikesHandler;

export const addReplyLikeHandler = replyHandlers.addLikeHandler;
export const removeReplyLikeHandler = replyHandlers.removeLikeHandler;
export const countReplyLikesHandler = replyHandlers.countLikesHandler;
