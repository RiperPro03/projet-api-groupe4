import { Router } from "express";

import {
  getCommentRepliesController,
  getCommentsController,
} from "../controllers/content.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardInteractionRequest = createForwardHandler("interactions");

router.all("/posts/likes", authMiddleware, forwardInteractionRequest);
router.all("/posts/likes/count", authMiddleware, forwardInteractionRequest);
router.all("/posts/likes/status", authMiddleware, forwardInteractionRequest);

router.get("/comments", authMiddleware, getCommentsController);
router.post("/comments", authMiddleware, forwardInteractionRequest);
router.get("/comments/:commentId/replies", authMiddleware, getCommentRepliesController);
router.all("/comments/likes", authMiddleware, forwardInteractionRequest);
router.all("/comments/likes/count", authMiddleware, forwardInteractionRequest);
router.all("/comments/likes/status", authMiddleware, forwardInteractionRequest);

router.all("/replies/likes", authMiddleware, forwardInteractionRequest);
router.all("/replies/likes/count", authMiddleware, forwardInteractionRequest);

export default router;
