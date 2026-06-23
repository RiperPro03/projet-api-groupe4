import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./auth.middleware";
import { buildServiceUrl } from "../config/services";
import {
  getUserStateByUserId,
  isUserRole,
  type UserRole,
} from "../services/user.service";
import { requestService } from "../utils/http-client";

const forbiddenPayload = {
  status: "error",
  message: "Forbidden",
} as const;

type AccessRule = {
  roles: readonly UserRole[];
  ownerBodyField?: string;
  ownerQueryParam?: string;
  ownerParam?: string;
};

type PostResponse = {
  data?: {
    post?: {
      authorId?: string;
    } | null;
  };
};

const getRouteValue = (value: unknown) => {
  const resolvedValue = Array.isArray(value) ? value[0] : value;

  return typeof resolvedValue === "string" && resolvedValue.trim()
    ? resolvedValue.trim()
    : null;
};

const hasBodyField = (body: unknown, field: string) =>
  typeof body === "object" &&
  body !== null &&
  !Array.isArray(body) &&
  Object.prototype.hasOwnProperty.call(body, field);

export const requireRoles =
  (roles: readonly UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;

    if (!role || !roles.includes(role as UserRole)) {
      return res.status(403).json(forbiddenPayload);
    }

    return next();
  };

export const allowVisitorOrRoles =
  (roles: readonly UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;

    if (!role || roles.includes(role as UserRole)) {
      return next();
    }

    return res.status(403).json(forbiddenPayload);
  };

export const requireOwnerOrRoles =
  ({ roles, ownerQueryParam }: AccessRule) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;

    if (role && roles.includes(role as UserRole)) {
      return next();
    }

    if (ownerQueryParam && req.authUser?.id) {
      const ownerId = getRouteValue(req.query[ownerQueryParam]);

      if (ownerId === req.authUser.id) {
        return next();
      }
    }

    return res.status(403).json(forbiddenPayload);
  };

export const requireParamOwnerOrRoles =
  ({ roles, ownerParam }: AccessRule) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;

    if (role && roles.includes(role as UserRole)) {
      return next();
    }

    if (ownerParam && req.authUser?.id) {
      const ownerId = getRouteValue(req.params[ownerParam]);

      if (ownerId === req.authUser.id) {
        return next();
      }
    }

    return res.status(403).json(forbiddenPayload);
  };

export const requireBodyOwnerOrRoles =
  ({ roles, ownerBodyField }: AccessRule) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;

    if (role && roles.includes(role as UserRole)) {
      return next();
    }

    if (ownerBodyField && req.authUser?.id) {
      const ownerId = getRouteValue(req.body?.[ownerBodyField]);

      if (ownerId === req.authUser.id) {
        return next();
      }
    }

    return res.status(403).json(forbiddenPayload);
  };

export const forbidModeratorAdminUserAccess =
  (targetParam: string) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.authUser?.role !== "MODERATOR") {
      return next();
    }

    const targetUserId = getRouteValue(req.params[targetParam]);
    const updatesRole = hasBodyField(req.body, "role");

    if (!targetUserId) {
      return res.status(403).json(forbiddenPayload);
    }

    if (updatesRole && targetUserId === req.authUser.id) {
      return res.status(403).json(forbiddenPayload);
    }

    if (getRouteValue(req.body?.role) === "ADMIN") {
      return res.status(403).json(forbiddenPayload);
    }

    try {
      const targetState = await getUserStateByUserId(
        targetUserId,
        req.header("authorization"),
        req.header("x-request-id"),
      );

      if (isUserRole(targetState?.role) && targetState.role === "ADMIN") {
        return res.status(403).json(forbiddenPayload);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

export const requirePostOwnerOrRoles =
  (roles: readonly UserRole[]) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;

    if (role && roles.includes(role as UserRole)) {
      return next();
    }

    const userId = req.authUser?.id;
    const postId = getRouteValue(req.params.id);

    if (!userId || !postId) {
      return res.status(403).json(forbiddenPayload);
    }

    try {
      const response = await requestService<PostResponse>("posts", {
        method: "GET",
        url: buildServiceUrl("posts", `/${encodeURIComponent(postId)}`),
        headers: {
          ...(req.header("x-request-id")
            ? { "x-request-id": req.header("x-request-id") as string }
            : {}),
        },
      });

      if (response.data.data?.post?.authorId === userId) {
        return next();
      }

      return res.status(403).json(forbiddenPayload);
    } catch (error) {
      return next(error);
    }
  };

export const authenticatedRoles = ["USER", "MODERATOR", "ADMIN"] as const;
export const moderationRoles = ["MODERATOR", "ADMIN"] as const;
export const adminRoles = ["ADMIN"] as const;
