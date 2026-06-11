import type { Request, Response } from "express";

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

function handleError(error: unknown, res: Response) {
  if (error instanceof LikeError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Erreur interne du serveur" });
}

function createLikeHandlers(targetType: TargetType) {
  return {
    async addLikeHandler(req: Request, res: Response) {
      try {
        const userId = getUserId(req);
        const targetId = getTargetId(req);

        if (!userId) {
          res.status(400).json({ error: "userId est requis" });
          return;
        }

        if (!targetId) {
          res.status(400).json({ error: "targetId est requis" });
          return;
        }

        const like = await addLike(
          userId,
          targetType,
          targetId,
          getPostId(req)
        );
        res.status(201).json(like);
      } catch (error) {
        handleError(error, res);
      }
    },

    async removeLikeHandler(req: Request, res: Response) {
      try {
        const userId = getUserId(req);
        const targetId = getTargetId(req);

        if (!userId) {
          res.status(400).json({ error: "userId est requis" });
          return;
        }

        if (!targetId) {
          res.status(400).json({ error: "targetId est requis" });
          return;
        }

        await removeLike(userId, targetType, targetId);
        res.status(200).json({ message: "Like supprimé" });
      } catch (error) {
        handleError(error, res);
      }
    },

    async countLikesHandler(req: Request, res: Response) {
      try {
        const targetId = getTargetId(req);

        if (!targetId) {
          res.status(400).json({ error: "targetId est requis" });
          return;
        }

        const count = await countLikes(targetType, targetId);
        res.status(200).json({ count });
      } catch (error) {
        handleError(error, res);
      }
    },
  };
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
