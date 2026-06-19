import type { NextFunction, Request, Response } from "express";

import { NotificationError } from "../services/notification.service.js";

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new NotificationError("Route introuvable", 404));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (error instanceof NotificationError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);

  return res.status(500).json({ error: "Erreur interne du serveur" });
};
