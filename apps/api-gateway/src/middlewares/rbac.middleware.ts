import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./auth.middleware";
import { buildServiceUrl } from "../config/services";
import type { UserRole } from "../services/user.service";
import { requestService } from "../utils/http-client";

const forbiddenPayload = {
  status: "error",
  message: "Forbidden",
} as const;

type AccessRule = {
  roles: readonly UserRole[];
  ownerQueryParam?: string;
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
