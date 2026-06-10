import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken, type AuthenticatedUser } from "../services/auth.service";
import { ServiceError } from "../utils/http-client";

export type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
};

export const unauthorizedPayload = {
  status: "error",
  message: "Unauthorized",
} as const;

const extractBearerToken = (authorization: string | undefined) => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authorization = req.header("authorization");
  const token = extractBearerToken(authorization);

  if (!authorization || !token) {
    return res.status(401).json(unauthorizedPayload);
  }

  try {
    const authUser = await verifyAccessToken(authorization, req.header("x-request-id"));
    req.authUser = authUser;
    return next();
  } catch (error) {
    if (
      error instanceof ServiceError &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      return res.status(401).json(unauthorizedPayload);
    }

    return next(error);
  }
};
