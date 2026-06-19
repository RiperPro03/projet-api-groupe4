import { Router } from "express";

import {
  getCommentRepliesController,
  getCommentsController,
} from "../controllers/content.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authenticatedRoles, requireRoles } from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardInteractionRequest = createForwardHandler("interactions");

router.all("/posts/likes", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/posts/likes/count", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/posts/likes/status", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);

router.get("/comments", authMiddleware, requireRoles(authenticatedRoles), getCommentsController);
router.post("/comments", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.get(
  "/comments/:commentId/replies",
  authMiddleware,
  requireRoles(authenticatedRoles),
  getCommentRepliesController,
);
router.all("/comments/likes", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/comments/likes/count", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/comments/likes/status", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);

router.all("/replies/likes", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);
router.all("/replies/likes/count", authMiddleware, requireRoles(authenticatedRoles), forwardInteractionRequest);

export default router;
