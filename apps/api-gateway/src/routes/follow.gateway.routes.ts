import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import {
  authenticatedRoles,
  requireBodyOwnerOrRoles,
  requireOwnerOrRoles,
  requireRoles,
} from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardFollowRequest = createForwardHandler("follows");

router.all("/health", forwardFollowRequest);
router.use(authMiddleware);
router.post(
  "/",
  requireBodyOwnerOrRoles({ roles: [], ownerBodyField: "followerId" }),
  forwardFollowRequest,
);
router.delete(
  "/",
  requireBodyOwnerOrRoles({ roles: [], ownerBodyField: "followerId" }),
  forwardFollowRequest,
);
router.get(
  "/following",
  requireOwnerOrRoles({ roles: [], ownerQueryParam: "followerId" }),
  forwardFollowRequest,
);
router.use(requireRoles(authenticatedRoles));
router.use(forwardFollowRequest);

export default router;