import type { NextFunction, Request, Response } from "express";

import { CommentError } from "../services/comment.service.js";
import { LikeError } from "../services/like.service.js";

function isInteractionError(
  error: unknown
): error is LikeError | CommentError {
  return error instanceof LikeError || error instanceof CommentError;
}

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new LikeError("Route introuvable", 404));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (isInteractionError(error)) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);

  return res.status(500).json({ error: "Erreur interne du serveur" });
};
