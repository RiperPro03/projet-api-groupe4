import { Router } from "express";

import {
  getCommentRepliesController,
  getCommentsController,
} from "../controllers/content.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  authenticatedRoles,
  requireBodyOwnerOrRoles,
  requireOwnerOrRoles,
  requireRoles,
} from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardInteractionRequest = createForwardHandler("interactions");

router.post("/posts/likes", authMiddleware, requireBodyOwnerOrRoles({ roles: [], ownerBodyField: "userId" }), forwardInteractionRequest);
router.delete("/posts/likes", authMiddleware, requireBodyOwnerOrRoles({ roles: [], ownerBodyField: "userId" }), forwardInteractionRequest);
router.get("/posts/likes", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/posts/likes/count", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/posts/likes/status", authMiddleware, requireOwnerOrRoles({ roles: [], ownerQueryParam: "userId" }), forwardInteractionRequest);

router.get("/comments", authMiddleware, requireRoles(authenticatedRoles), getCommentsController);
router.post("/comments", authMiddleware, requireBodyOwnerOrRoles({ roles: [], ownerBodyField: "authorId" }), forwardInteractionRequest);
router.get(
  "/comments/:commentId/replies",
  authMiddleware,
  requireRoles(authenticatedRoles),
  getCommentRepliesController,
);
router.get(
  "/comments/:commentId",
  authMiddleware,
  requireRoles(authenticatedRoles),
  forwardInteractionRequest,
);
router.post("/comments/likes", authMiddleware, requireBodyOwnerOrRoles({ roles: [], ownerBodyField: "userId" }), forwardInteractionRequest);
router.delete("/comments/likes", authMiddleware, requireBodyOwnerOrRoles({ roles: [], ownerBodyField: "userId" }), forwardInteractionRequest);
router.all("/comments/likes/count", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/comments/likes/status", authMiddleware, requireOwnerOrRoles({ roles: [], ownerQueryParam: "userId" }), forwardInteractionRequest);

router.all("/replies/likes", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/replies/likes/count", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);

export default router;
