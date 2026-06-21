import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken, type AuthenticatedUser } from "../services/auth.service";
import { getCurrentUserRole } from "../services/user.service";
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

const getCookieValue = (cookieHeader: string | undefined, key: string) => {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(key.length + 1));
};

const attachAuthenticatedUser = async (
  req: AuthenticatedRequest,
  authorization: string,
) => {
  const authUser = await verifyAccessToken(authorization, req.header("x-request-id"));
  const currentRole = await getCurrentUserRole(
    authUser.id,
    authorization,
    req.header("x-request-id"),
  );

  req.authUser = {
    ...authUser,
    ...(currentRole ? { role: currentRole } : {}),
  };
  req.headers.authorization = authorization;
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
  const cookieToken = getCookieValue(req.header("cookie"), "accessToken");
  const token = extractBearerToken(authorization) ?? cookieToken;
  const resolvedAuthorization = authorization ?? (token ? `Bearer ${token}` : undefined);

  if (!resolvedAuthorization || !token) {
    return res.status(401).json(unauthorizedPayload);
  }

  try {
    await attachAuthenticatedUser(req, resolvedAuthorization);
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

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authorization = req.header("authorization");
  const cookieToken = getCookieValue(req.header("cookie"), "accessToken");
  const token = extractBearerToken(authorization) ?? cookieToken;
  const resolvedAuthorization = authorization ?? (token ? `Bearer ${token}` : undefined);

  if (!resolvedAuthorization || !token) {
    return next();
  }

  try {
    await attachAuthenticatedUser(req, resolvedAuthorization);
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
